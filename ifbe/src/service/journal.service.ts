import { InjectModel } from "@nestjs/sequelize";
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { Client } from "../model/client.model";
import { Take } from "../util/types";
import { Journal } from "../model/journal.model";
import { JournalEntry } from "../model/journalEntry.model";
import { StorageService } from "./storage.service";

export type PhotoContent = {type: 'photo'; url: string};
export type VideoContent = {type: 'video'; url: string};
export type VisualContent = PhotoContent | VideoContent;
export type MediaContent = {
    type: 'media';
    media: VisualContent[];
    caption?: string;
};
export type AudioContent = {type: 'audio'; url: string; length: number};
export type TextContent = {type: 'text'; text: string};

type JournalContents = (TextContent | MediaContent | AudioContent);

export interface ClientJournalEntry {
    id: string;
    date: Date;
    hidden?: boolean;
    content: JournalContents;
}

export type JournalType = Take<JournalContents, 'type'>;

interface StorageItem {
    key: string;
}

function extractJournalText(journal: JournalContents): string {
    return journal.type === 'text' ? journal.text : journal.type === 'media' ? journal.caption : '' + journal.length;
}

export class JournalService {
    constructor(
        @InjectModel(Journal) private journalModel: typeof Journal,
        private storageService: StorageService,
    ) {}

    private static extractEntries(journal: JournalContents) {
        switch (journal.type) {
            case 'media':
                return journal.media.map((m, i) => ({clientEntryId: m.url, type: m.type, sequence: i + 1}));
            case 'audio':
                return [{clientEntryId: journal.url, type: 'audio', sequence: 0}];
            default:
                return [];
        }
    }

    async add(client: Client, journal: ClientJournalEntry, answerId?: number) {
        const entries = JournalService.extractEntries(journal.content);

        const existing = await this.journalModel.findOne({where: {clientId: client.id, clientJournalId: journal.id}, include: [{all: true}]});
        if (existing) {
            if (existing.type !== journal.content.type) {
                throw new BadRequestException("Cannot change journal type");
            }
            if (existing.answerId || answerId) {
                throw new BadRequestException("Cannot update survey answer.");
            }
            existing.text = extractJournalText(journal.content);
            existing.hidden = journal.hidden ?? false;
            // Match up existing entries to new entries
            const existingClientEntryIds = new Set<string>();
            existing.entries.forEach((oldEntry) => {
                if (entries.some(e => oldEntry.clientEntryId === e.clientEntryId)) {
                    // Nothing to do
                    existingClientEntryIds.add(oldEntry.clientEntryId);
                } else {
                    oldEntry.destroy();
                }
            });
            entries.forEach((newEntry) => {
                if (existingClientEntryIds.has(newEntry.clientEntryId)) {
                    // Already handled
                    return;
                }
                existing.$create('entry', newEntry);
            });
            return existing.save();
        } else {
            let createdAt = new Date(journal.date);
            if (createdAt.getTime() > Date.now()) {
                createdAt = new Date();
            }
            return this.journalModel.create({
                type: journal.content.type,
                clientId: client.id,
                text: extractJournalText(journal.content),
                hidden: journal.hidden ?? false,
                clientJournalId: journal.id,
                entries: entries,
                answerId,
                createdAt,
            }, {include: [{all: true}]});
        }
    }

    async delete(client: Client|number, clientJournalId: string) {
        const journal = await this.journalModel.findOne({
            where: {clientId: (typeof client === 'number' ? client : client.id), clientJournalId},
            include: ['entries'],
        });
        if (journal.clientId !== (typeof client === 'number' ? client : client.id)) {
            throw new Error("Mismatched client/journal");
        }
        if (journal.entries.length > 0) {
            await Promise.all(journal.entries.map(async (entry) => {
                const result = await this.storageService.delete(entry.storageUrl);
                result.send();
                await entry.destroy();
            }));
        }
        return journal.destroy();
    }

    async get(client: Client|number, journalId: number) {
        const journal = await this.journalModel.findByPk(journalId, {include: [JournalEntry]});
        if (journal.clientId !== (typeof client === 'number' ? client : client.id)) {
            throw new Error("Mismatched client/journal");
        }
        return journal;
    }

    async getMediaUrl(client: Client|number, journalId: number, journalEntryId: number): Promise<string> {
        const journal = await this.get(client, journalId);

        const entry = journal.entries.find(entry => {
            return entry.id === journalEntryId;
        });
        if (!entry) {
            console.log(journal, journal.entries, journalEntryId);
            throw new NotFoundException("Unknown journal entry");
        }
        if (!entry.storageUrl) {
            throw new NotFoundException(`No media stored for journal ${journalId} entry ${journalEntryId}`);
        }
        return await this.storageService.getSignedUrl(entry.storageUrl);
    }

    async updateEntry(journal: Journal, url: string, upload: StorageItem) {
        // Find the entry with the right URL(i.e. clientEntryId)
        const entry = journal.entries.find(entry => entry.clientEntryId === url);
        if (!entry) {
            console.log("Entry not found", journal.entries,  journal.entries.map(e => e.clientEntryId));
            throw new NotFoundException("Unknown journal entry");
        }

        // Store the uploaded id in the entry
        entry.storageUrl = upload.key;

        return entry.save();
    }
}

import { InjectModel } from "@nestjs/sequelize";

import { Client } from "../model/client.model";
import { Take } from "../util/types";
import { Journal } from "../model/journal.model";
import { JournalEntry } from "../model/journalEntry.model";
import { NotFoundException } from "@nestjs/common";
import { Stream } from "stream";
import * as fs from "fs";

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
export type JournalContent = (TextContent | MediaContent | AudioContent) & {clientJournalId: string};

export type JournalType = Take<JournalContent, 'type'>;

interface StorageItem {
    path: string;
}

export class JournalService {
    constructor(@InjectModel(Journal) private journalModel: typeof Journal,
    ) {}

    private static extractEntries(journal: JournalContent) {
        switch (journal.type) {
            case 'media':
                return journal.media.map(m => ({clientEntryId: m.url, type: m.type}));
            case 'audio':
                return [{clientEntryId: journal.url, type: 'audio'}];
            default:
                return [];
        }
    }

    async add(client: Client, journal: JournalContent) {
        const entries = JournalService.extractEntries(journal);
        return await this.journalModel.create({
            type: journal.type,
            clientId: client.id,
            text: journal.type === 'text' ? journal.text : journal.type === 'media' ? journal.caption : journal.length,
            clientJournalId: journal.clientJournalId,
            entries: entries,
        }, {include: [{all: true}]});
    }

    async get(client: Client|number, journalId: number) {
        const journal = await this.journalModel.findByPk(journalId, {include: [JournalEntry]});
        if (journal.clientId !== (typeof client === 'number' ? client : client.id)) {
            throw new Error("Mismatched client/journal");
        }
        return journal;
    }

    async getMedia(clientId: number, journalId: number, journalEntryId: number): Promise<Stream> {
        const journal = await this.get(clientId, journalId);

        const entry = journal.entries.find(entry => entry.id === journalEntryId);
        if (!entry) {
            throw new NotFoundException("Unknown journal entry");
        }

        return fs.createReadStream(entry.storageUrl);
    }

    async updateEntry(journal: Journal, url: string, upload: StorageItem) {
        // Find the entry with the right URL(/clientEntryId)
        const entry = journal.entries.find(entry => entry.clientEntryId === url);
        if (!entry) {
            throw new NotFoundException("Unknown journal entry");
        }

        // Store the uploaded URL in the entry
        entry.storageUrl = upload.path;

        return await entry.save();
    }
}

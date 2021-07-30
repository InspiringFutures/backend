import {
    AllowNull,
    BelongsTo,
    Column,
    ForeignKey, HasMany,
    Model,
    Table
} from 'sequelize-typescript';
import { DataTypes } from "sequelize";

import { Client } from "./client.model";
import { JournalType } from "../service/journal.service";
import { JournalEntry } from "./journalEntry.model";
import { Answer } from './answer.model';

@Table
export class Journal extends Model<Journal> {
    @AllowNull(false)
    @Column(DataTypes.ENUM('text', 'audio', 'media'))
    type: JournalType;

    @AllowNull(true)
    @Column
    text: string;

    @AllowNull(false)
    @Column
    hidden: boolean;

    // For journals in an answer, the clientJournalId can be parsed as `${questionId}-${client id}`
    @AllowNull(false)
    @Column
    clientJournalId: string;

    @ForeignKey(() => Client)
    @AllowNull(false)
    @Column
    clientId: number;

    @BelongsTo(() => Client)
    client: Client;

    @ForeignKey(() => Answer)
    @AllowNull(true)
    @Column
    answerId: number | null;

    @BelongsTo(() => Answer)
    answer: Answer | null;

    @HasMany(() => JournalEntry)
    entries: JournalEntry[];
}

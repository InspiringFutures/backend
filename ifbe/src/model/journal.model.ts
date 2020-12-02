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
    clientJournalId: string;

    @ForeignKey(() => Client)
    @AllowNull(false)
    @Column
    clientId: number;

    @BelongsTo(() => Client)
    client: Client;

    @HasMany(() => JournalEntry)
    entries: JournalEntry[];
}

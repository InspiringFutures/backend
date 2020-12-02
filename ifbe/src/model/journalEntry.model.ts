import {
    AllowNull,
    BelongsTo,
    Column,
    ForeignKey,
    Model,
    Table
} from 'sequelize-typescript';
import { DataTypes } from "sequelize";
import { Journal } from "./journal.model";

export type EntryType =
    | 'audio'
    | 'photo'
    | 'video'
;

@Table
export class JournalEntry extends Model<JournalEntry> {
    @AllowNull(false)
    @Column(DataTypes.ENUM('audio', 'photo', 'video'))
    type: EntryType;

    @AllowNull(false)
    @Column
    clientEntryId: string;

    @AllowNull(true)
    @Column
    storageUrl: string;

    @ForeignKey(() => Journal)
    @AllowNull(false)
    @Column
    journalId: number;

    @BelongsTo(() => Journal)
    journal: Journal;
}

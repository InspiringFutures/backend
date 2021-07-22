import {
    AllowNull,
    BelongsTo,
    Column,
    Default,
    ForeignKey, HasMany,
    Model,
    Table,
} from 'sequelize-typescript';
import { DataTypes } from 'sequelize';

import { Group } from "./group.model";
import { Journal } from './journal.model';

export enum ClientStatus {
    added = 'added',
    registered = 'registered',
    suspended = 'suspended',
    deleted = 'deleted',
}

@Table
export class Client extends Model<Client> {
    @Column
    participantID: string;

    @Column
    token: string|null;

    @Default('added')
    @Column(DataTypes.ENUM('added', 'registered', 'suspended', 'deleted'))
    status: ClientStatus;

    @Column
    pushToken: string|null;

    @ForeignKey(() => Group)
    @AllowNull(false)
    @Column
    groupId: number;

    @BelongsTo(() => Group)
    group: Group;

    @HasMany(() => Journal)
    journals: Journal[];
}

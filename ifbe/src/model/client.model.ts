import {
    AllowNull,
    BelongsTo,
    Column,
    Default,
    ForeignKey,
    Model,
    Table,
} from 'sequelize-typescript';
import { DataTypes } from 'sequelize';

import { Group } from "./group.model";

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


    @ForeignKey(() => Group)
    @AllowNull(false)
    @Column
    groupId: number;

    @BelongsTo(() => Group)
    group: Group;
}

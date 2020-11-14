import { AllowNull, BelongsTo, Column, ForeignKey, Model, Table } from 'sequelize-typescript';

import { Group } from "./group.model";

@Table
export class Client extends Model<Client> {
    @Column
    nickName: string;

    @Column
    token: string;

    @ForeignKey(() => Group)
    @AllowNull(false)
    @Column
    groupId: number;

    @BelongsTo(() => Group)
    group: Group;
}

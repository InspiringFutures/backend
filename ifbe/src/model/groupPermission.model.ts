import { Column, Default, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';

import { Admin } from "./admin.model";
import { Group } from "./group.model";
import { DataTypes } from "sequelize";

export enum GroupAccessLevel {
    'view' = 'view',
    'edit' = 'edit',
    'owner' = 'owner'
}

@Table
export class GroupPermission extends Model<GroupPermission> {
    @Default('normal')
    @Column(DataTypes.ENUM(GroupAccessLevel.view, GroupAccessLevel.edit, GroupAccessLevel.owner))
    level: GroupAccessLevel;

    @ForeignKey(() => Group)
    @Column
    groupId: number;

    @ForeignKey(() => Admin)
    @Column
    adminId: number;
}

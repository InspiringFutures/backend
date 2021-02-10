import { Column, Default, ForeignKey, Model, Table } from 'sequelize-typescript';

import { Admin } from "./admin.model";
import { Group } from "./group.model";
import { DataTypes } from "sequelize";
import { AccessLevel, AccessLevels } from "./accessLevels";

@Table
export class GroupPermission extends Model<GroupPermission> {
    @Default('normal')
    @Column(DataTypes.ENUM(...AccessLevels))
    level: AccessLevel;

    @ForeignKey(() => Group)
    @Column
    groupId: number;

    @ForeignKey(() => Admin)
    @Column
    adminId: number;
}

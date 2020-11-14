import {
    AllowNull,
    Column,
    Default,
    Model,
    Table
} from 'sequelize-typescript';
import { DataTypes } from "sequelize";

export enum AdminLevel {
    normal = 'normal',
    super = 'super',
}

@Table
export class Admin extends Model<Admin> {
    @Column
    email: string;

    @AllowNull(true)
    @Column
    name: string;

    @Default('normal')
    @Column(DataTypes.ENUM('normal', 'super'))
    level: AdminLevel;

    @AllowNull(true)
    @Column
    lastLoginAt: Date;
}

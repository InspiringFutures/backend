import { BelongsTo, Column, Default, ForeignKey, Model, Table } from 'sequelize-typescript';
import { DataTypes } from "sequelize";

import { Admin } from "./admin.model";
import { Survey } from "./survey.model";
import { AccessLevel, AccessLevels } from "./accessLevels";

@Table
export class SurveyPermission extends Model<SurveyPermission> {
    @Default('normal')
    @Column(DataTypes.ENUM(...AccessLevels))
    level: AccessLevel;

    @ForeignKey(() => Survey)
    @Column
    surveyId: number;

    @ForeignKey(() => Admin)
    @Column
    adminId: number;
}

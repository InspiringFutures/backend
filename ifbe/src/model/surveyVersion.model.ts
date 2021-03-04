import {
    BelongsTo,
    BelongsToMany,
    Column,
    ForeignKey,
    HasMany,
    Model,
    Table
} from 'sequelize-typescript';

import { Admin } from "./admin.model";
import { Survey } from "./survey.model";
import { DataTypes } from 'sequelize';

@Table
export class SurveyVersion extends Model<SurveyVersion> {
    @Column(DataTypes.JSON)
    content: { content: any };

    @Column
    autoSave: boolean;

    @ForeignKey(() => Survey)
    @Column
    surveyId: number;

    @BelongsTo(() => Survey)
    survey: Survey;

    @ForeignKey(() => Admin)
    @Column
    creatorId: number;

    @BelongsTo(() => Admin)
    creator: Admin;
}

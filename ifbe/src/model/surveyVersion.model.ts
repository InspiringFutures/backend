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

@Table
export class SurveyVersion extends Model<SurveyVersion> {
    @Column
    content: string;

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

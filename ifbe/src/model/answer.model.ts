import {
    AllowNull,
    AutoIncrement,
    BelongsTo,
    Column,
    ForeignKey,
    Model,
    PrimaryKey,
    Table,
} from 'sequelize-typescript';

import { DataTypes } from 'sequelize';
import { SurveyAllocation } from './surveyAllocation.model';
import { Client } from './client.model';

@Table
export class Answer extends Model<Answer> {
    @PrimaryKey
    @AutoIncrement
    @Column
    id: number;

    @ForeignKey(() => SurveyAllocation)
    @AllowNull(false)
    @Column
    surveyAllocationId: number;

    @BelongsTo(() => SurveyAllocation)
    surveyAllocation: SurveyAllocation;

    @ForeignKey(() => Client)
    @AllowNull(false)
    @Column
    clientId: number;

    @BelongsTo(() => Client)
    client: Client;

    @Column(DataTypes.JSON)
    answer: {
        complete: boolean;
        answers: {
            [questionId: string]: any;
        };
    };
}

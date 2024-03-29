import {
    AllowNull,
    AutoIncrement,
    BelongsTo,
    Column,
    ForeignKey,
    HasMany,
    Model,
    PrimaryKey,
    Table,
} from 'sequelize-typescript';

import { Admin } from './admin.model';
import { Group } from './group.model';
import { Survey } from './survey.model';
import { DataTypes } from 'sequelize';
import { Answer } from './answer.model';

export type SurveyAllocationType = 'oneoff' | 'initial';

@Table({
    paranoid: true,
})
export class SurveyAllocation extends Model<SurveyAllocation> {
    @PrimaryKey
    @AutoIncrement
    @Column
    id: number;

    @AllowNull(false)
    @Column(DataTypes.ENUM('oneoff', 'initial'))
    type: SurveyAllocationType;

    @Column
    note: string;

    @AllowNull(true)
    @Column
    openAt: Date|null;

    @AllowNull(true)
    @Column
    dueAt: Date|null;

    @AllowNull(true)
    @Column
    closeAt: Date|null;

    @AllowNull(true)
    @Column
    pushedAt: Date|null;

    @ForeignKey(() => Group)
    @AllowNull(false)
    @Column
    groupId: number;

    @BelongsTo(() => Group)
    group: Group;

    @ForeignKey(() => Survey)
    @AllowNull(false)
    @Column
    surveyId: number;

    @BelongsTo(() => Survey)
    survey: Survey;

    @ForeignKey(() => Admin)
    @AllowNull(false)
    @Column
    creatorId: number;

    @BelongsTo(() => Admin)
    creator: Admin;

    @HasMany(() => Answer)
    answers: Answer[];
}

import { BelongsTo, BelongsToMany, Column, HasMany, Model, Table } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';

import { Admin } from "./admin.model";
import { SurveyPermission } from "./surveyPermission.model";
import { SurveyVersion } from './surveyVersion.model';
import { SurveyAllocation } from './surveyAllocation.model';
import { Group } from './group.model';

type AdminWithPermission = Admin & { SurveyPermission: SurveyPermission };
type GroupWithAllocation = Group & { SurveyAllocation: SurveyAllocation };

@Table
export class Survey extends Model<Survey> {
    @Column
    name: string;

    @Column(DataTypes.JSON)
    content: { content: any; autoSave?: boolean };

    @Column
    updaterId: number;

    @BelongsTo(() => Admin, "updaterId")
    updater: Admin;

    @HasMany(() => SurveyVersion)
    versions: SurveyVersion[];

    @BelongsToMany(() => Admin, () => SurveyPermission)
    admins: AdminWithPermission[];

    @HasMany(() => SurveyPermission)
    permissions: SurveyPermission[];

    @BelongsToMany(() => Group, () => SurveyAllocation)
    groups: GroupWithAllocation[];

    @HasMany(() => SurveyAllocation)
    allocations: SurveyAllocation[];
}

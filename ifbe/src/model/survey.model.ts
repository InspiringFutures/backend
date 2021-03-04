import { BelongsTo, BelongsToMany, Column, HasMany, Model, Table } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';

import { Admin } from "./admin.model";
import { SurveyPermission } from "./surveyPermission.model";
import { SurveyVersion } from './surveyVersion.model';

type AdminWithPermission = Admin & { SurveyPermission: SurveyPermission };

@Table
export class Survey extends Model<Survey> {
    @Column
    name: string;

    @Column(DataTypes.JSON)
    content: { content: any };

    @Column
    updaterId: number;

    @BelongsTo(() => Admin, "updaterId")
    updater: Admin;

    @BelongsToMany(() => Admin, () => SurveyPermission)
    admins: AdminWithPermission[];

    @HasMany(() => SurveyPermission)
    permissions: SurveyPermission[];

    @HasMany(() => SurveyVersion)
    versions: SurveyVersion[];
}

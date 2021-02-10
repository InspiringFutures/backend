import { BelongsTo, BelongsToMany, Column, HasMany, Model, Table } from 'sequelize-typescript';

import { Admin } from "./admin.model";
import { SurveyPermission } from "./surveyPermission.model";

type AdminWithPermission = Admin & { SurveyPermission: SurveyPermission };

@Table
export class Survey extends Model<Survey> {
    @Column
    name: string;

    @Column
    content: string;

    @Column
    updaterId: number;

    @BelongsTo(() => Admin, "updaterId")
    updater: Admin;

    @BelongsToMany(() => Admin, () => SurveyPermission)
    admins: AdminWithPermission[];

    @HasMany(() => SurveyPermission)
    permissions: SurveyPermission[];
}

import { BelongsToMany, Column, HasMany, HasOne, Model, Table } from 'sequelize-typescript';

import { Admin } from "./admin.model";
import { Client } from "./client.model";
import { GroupPermission } from "./groupPermission.model";
import { SurveyAllocation } from './surveyAllocation.model';
import { Survey } from './survey.model';

type AdminWithPermission = Admin & { GroupPermission: GroupPermission };
type SurveyWithAllocation = Survey & { SurveyAllocation: SurveyAllocation };

@Table
export class Group extends Model<Group> {
    @Column
    name: string;

    @Column
    code: string;

    @Column
    apiURL?: string;

    @Column
    contactDetails?: string;

    @HasMany(() => Client)
    clients: Client[];

    @BelongsToMany(() => Admin, () => GroupPermission)
    admins: AdminWithPermission[];

    @HasMany(() => GroupPermission)
    permissions: GroupPermission[];

    setApiURLfromRequestIfNotSet() {
        if (this.apiURL === null) {
            this.apiURL = process.env.BASE_URL + '/api/';
        }
    }

    @BelongsToMany(() => Survey, () => SurveyAllocation)
    surveys: SurveyWithAllocation[];

    @HasMany(() => SurveyAllocation)
    allocations: SurveyAllocation[];

    @HasOne(() => SurveyAllocation, {
        scope: {
            type: 'initial',
        },
    })
    initialSurvey: SurveyAllocation | null;

}

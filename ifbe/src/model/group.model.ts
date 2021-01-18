import { BelongsToMany, Column, HasMany, Model, Table } from 'sequelize-typescript';

import { Admin } from "./admin.model";
import { Client } from "./client.model";
import { GroupPermission } from "./groupPermission.model";

type AdminWithPermission = Admin & { GroupPermission: GroupPermission };

@Table
export class Group extends Model<Group> {
    @Column
    name: string;

    @Column
    code: string;

    @Column
    apiURL?: string;

    @HasMany(() => Client)
    clients: Client[];

    @BelongsToMany(() => Admin, () => GroupPermission)
    admins: AdminWithPermission[];

    @HasMany(() => GroupPermission)
    permissions: GroupPermission[];

    setApiURLfromRequestIfNotSet(request) {
        if (this.apiURL === null) {
            this.apiURL = request.protocol + '://' + request.get('Host') + '/api/';
        }
    }
}
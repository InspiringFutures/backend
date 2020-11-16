import { BelongsToMany, Column, HasMany, Model, Table } from 'sequelize-typescript';

import { Admin } from "./admin.model";
import { Client } from "./client.model";
import { GroupPermission } from "./groupPermission.model";

@Table
export class Group extends Model<Group> {
    @Column
    name: string;

    @Column
    code: string;

    @Column
    apiUrl?: string;

    @HasMany(() => Client)
    clients: Client[];

    @BelongsToMany(() => Admin, () => GroupPermission)
    admins: Array<Admin & {GroupPermission: GroupPermission}>;
}

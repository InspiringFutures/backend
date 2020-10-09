import { Column, HasMany, Model, Table } from 'sequelize-typescript';

import { Client } from "./client.model";

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
}

import { Column, Model, Table } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';

export enum TokenType {
    reset = 'reset',
}

@Table
export class Token extends Model<Token> {
    @Column
    code: string;

    @Column(DataTypes.ENUM('reset'))
    type: TokenType;

    @Column
    for: string;

    @Column
    expiresAt: Date;
}

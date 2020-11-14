import { IsInt, IsString } from 'class-validator';

export class CreateClientDto {
    @IsString()
    readonly nickName: string;

    @IsString()
    readonly groupCode: string;
}

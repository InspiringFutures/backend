import { IsString } from 'class-validator';

export class RegisterClientDto {
    @IsString()
    readonly participantID: string;

    @IsString()
    readonly groupCode: string;
}

import { Body, Injectable, Post, Render, } from '@nestjs/common';
import { InjectModel } from "@nestjs/sequelize";

import { Controller } from '../util/autopage';
import { Admin, AdminLevel } from "../model/admin.model";
import { NeedsSuperAdmin } from "../util/guard";
import { redirect } from "../util/redirect";

@Controller('admin')
@Injectable()
export class AdminController {
    constructor(
        @InjectModel(Admin)
        private adminModel: typeof Admin,
    ) {}

    @Post('add')
    @Render('admin/error')
    //@NeedsSuperAdmin()
    async add(@Body('email') email: string, @Body('superuser') superuser: boolean) {

        const admin = await this.adminModel.create({
                                                       email: email,
                                                       level: superuser ? AdminLevel.super : AdminLevel.normal,
                                                   });
        if (admin !== null) {
            throw redirect('/admin');
        }
        return {msg: "There was a problem creating " + email};
    }
}

import { Module } from '@nestjs/common';
import { SequelizeModule, SequelizeModuleOptions } from "@nestjs/sequelize";

import { GroupController } from "./api/group.controller";
import { Group } from "./model/group.model";
import { Client } from "./model/client.model";
import { ClientController } from "./api/client.controller";
import { RootController } from "./root.controller";
import { GoogleServiceProvider } from "./service/google.service";
import { LoginController } from "./controller/login.controller";
import { Admin } from "./model/admin.model";
import { SampleController } from './sample.controller';
import { UserService } from './service/user.service';
import { AdminController } from "./controller/admin.controller";
import { GroupService } from "./service/group.service";
import { GroupPermission } from "./model/groupPermission.model";
import { JournalService } from "./service/journal.service";
import { Journal } from "./model/journal.model";
import { JournalEntry } from "./model/journalEntry.model";
import { MulterModule } from "@nestjs/platform-express";

const MODELS = [Group, Client, Admin, GroupPermission, Journal, JournalEntry];
const POSTGRES: SequelizeModuleOptions = {
    dialect: 'postgres',
    host: 'postgres',
    port: 5432,
    username: 'dev',
    password: 'password',
    database: 'dev',
};
const TEST: SequelizeModuleOptions = {
    dialect: 'postgres',
    host: 'ifbe_test',
    port: 5430,
    username: 'test',
    password: 'password',
    database: 'test',
};

@Module({
  imports: [SequelizeModule.forRoot({
                                      ...(process.env.NODE_ENV === 'test' ? TEST : POSTGRES),
                                      models: MODELS,
                                    }),
      SequelizeModule.forFeature(MODELS),
      MulterModule.registerAsync({
          imports: [],
          useFactory: async () => ({
              dest: process.env.NODE_ENV === 'test' ? './test/temp_uploads' : (() => {throw new Error("Not configured yet")})(),
          }),
          inject: [],
      })
  ],
  controllers: [GroupController, ClientController, RootController, LoginController, SampleController, AdminController],
  providers: [GoogleServiceProvider, UserService, GroupService, JournalService],
})
export class AppModule {}

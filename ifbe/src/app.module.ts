import { APP_GUARD, Reflector } from "@nestjs/core";
import { Module } from '@nestjs/common';
import { SequelizeModule } from "@nestjs/sequelize";

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
import { RolesGuard } from "./util/guard";
import { AdminController } from "./controller/admin.controller";

@Module({
  imports: [SequelizeModule.forRoot({
                                      dialect: 'postgres',
                                      host: 'postgres',
                                      port: 5432,
                                      username: 'dev',
                                      password: 'password',
                                      database: 'dev',
                                      models: [Group, Client, Admin],
                                    }),
      SequelizeModule.forFeature([Group, Client, Admin]),
  ],
  controllers: [GroupController, ClientController, RootController, LoginController, SampleController, AdminController],
  providers: [GoogleServiceProvider, UserService],
})
export class AppModule {}

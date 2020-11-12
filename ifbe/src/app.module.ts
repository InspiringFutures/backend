import { Module } from '@nestjs/common';
import { GroupController } from "./group.controller";
import { SequelizeModule } from "@nestjs/sequelize";
import { Group } from "./group.model";
import { Client } from "./client.model";
import { ClientController } from "./client.controller";
import { RootController } from "./root.controller";
import GoogleServiceProvider from "./google.service";
import { LoginController } from "./login.controller";
import { Admin } from "./admin.model";

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
  controllers: [GroupController, ClientController, RootController, LoginController],
  providers: [GoogleServiceProvider],
})
export class AppModule {}

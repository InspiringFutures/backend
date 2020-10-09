import { Module } from '@nestjs/common';
import { GroupController } from "./group.controller";
import { SequelizeModule } from "@nestjs/sequelize";
import { Group } from "./group.model";
import { Client } from "./client.model";
import { ClientController } from "./client.controller";

@Module({
  imports: [SequelizeModule.forRoot({
                                      dialect: 'postgres',
                                      host: 'postgres',
                                      port: 5432,
                                      username: 'dev',
                                      password: 'password',
                                      database: 'dev',
                                      models: [Group, Client],
                                    }),
      SequelizeModule.forFeature([Group, Client]),
  ],
  controllers: [GroupController, ClientController],
  providers: [],
})
export class AppModule {}

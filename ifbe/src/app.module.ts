import { Module } from '@nestjs/common';
import { SequelizeModule, SequelizeModuleOptions } from '@nestjs/sequelize';
import { MulterModule } from '@nestjs/platform-express';

import { GroupController } from './api/group.controller';
import { Group } from './model/group.model';
import { Client } from './model/client.model';
import { ClientController } from './api/client.controller';
import { RootController } from './root.controller';
import { GoogleServiceProvider } from './service/google.service';
import { LoginController } from './controller/login.controller';
import { Admin } from './model/admin.model';
import { SampleController } from './sample.controller';
import { UserService } from './service/user.service';
import { AdminController } from './controller/admin.controller';
import { GroupService } from './service/group.service';
import { GroupPermission } from './model/groupPermission.model';
import { JournalService } from './service/journal.service';
import { Journal } from './model/journal.model';
import { JournalEntry } from './model/journalEntry.model';
import { StorageService, StorageServiceProvider } from './service/storage.service';
import { ClientService } from './service/client.service';
import { QRController } from './controller/qr.controller';
import { Token } from './model/token.model';

const MODELS = [Group, Client, Admin, GroupPermission, Journal, JournalEntry, Token];

@Module({
    providers: [StorageServiceProvider],
    exports: [StorageService],
})
class StorageModule {}

@Module({
  imports: [SequelizeModule.forRoot({
                                      dialect: 'postgres',
                                      host: process.env.DB_HOST,
                                      port: parseInt(process.env.DB_PORT, 10),
                                      username: process.env.DB_USER,
                                      password: process.env.DB_PASSWORD,
                                      database: process.env.DB_NAME,
                                      models: MODELS,
                                    }),
      SequelizeModule.forFeature(MODELS),
      StorageModule,
      MulterModule.registerAsync({
          imports: [StorageModule],
          inject: [StorageService],
          useFactory: async (storageService: StorageService) => ({
              storage: storageService.multerStorage(),
          }),
      }),
  ],
  controllers: [GroupController, ClientController, RootController, LoginController, SampleController, AdminController, QRController],
  providers: [GoogleServiceProvider, UserService, GroupService, JournalService, StorageServiceProvider, ClientService],
})
export class AppModule {}

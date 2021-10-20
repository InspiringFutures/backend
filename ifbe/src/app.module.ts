import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MulterModule } from '@nestjs/platform-express';
import { ScheduleModule } from '@nestjs/schedule';

import { GroupController } from './api/group.controller';
import { Group } from './model/group.model';
import { Client } from './model/client.model';
import { ClientController } from './api/client.controller';
import { RootController } from './root.controller';
import { GoogleServiceProvider } from './service/google.service';
import { LoginController } from './controller/login.controller';
import { Admin } from './model/admin.model';
import { UserService } from './service/user.service';
import { AdminController } from './controller/admin.controller';
import { GroupService } from './service/group.service';
import { GroupPermission } from './model/groupPermission.model';
import { JournalService } from './service/journal.service';
import { Journal } from './model/journal.model';
import { JournalEntry } from './model/journalEntry.model';
import { ClientMediaService, ClientMediaServiceProvider } from './service/clientMedia.service';
import { ClientService } from './service/client.service';
import { QRController } from './controller/qr.controller';
import { Token } from './model/token.model';
import { AppMiddleware } from "./util/app.middleware";
import { Survey } from "./model/survey.model";
import { SurveyVersion } from "./model/surveyVersion.model";
import { SurveyPermission } from "./model/surveyPermission.model";
import { SurveyService } from "./service/survey.service";
import { SurveyController } from "./controller/survey.controller";
import { GroupAdminController } from "./controller/groupAdmin.controller";
import { SurveyAllocation } from './model/surveyAllocation.model';
import { Answer } from './model/answer.model';
import { PushNotificationService } from './service/pushNotification.service';
import { SurveyAllocationService } from './service/surveyAllocation.service';
import { VoiceOverServiceProvider } from './service/voiceOver.service';
import { VoiceOverController } from './api/voiceOver.controller';

// Fix bug with parsing timestamps from Postgres as non-local time
require('pg').types.setTypeParser(1114, function(stringValue) {
    return new Date(stringValue.substring(0, 10) + 'T' + stringValue.substring(11) + 'Z');
});

const MODELS = [Group, Client, Admin, GroupPermission, Journal, JournalEntry, Token, Survey, SurveyPermission, SurveyVersion, SurveyAllocation, Answer];

@Module({
    providers: [ClientMediaServiceProvider],
    exports: [ClientMediaService],
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
      ScheduleModule.forRoot(),
      StorageModule,
      MulterModule.registerAsync({
          imports: [StorageModule],
          inject: [ClientMediaService],
          useFactory: async (storageService: ClientMediaService) => ({
              storage: storageService.multerStorage(),
              limits: {
                fieldSize: 100000000,
                fileSize: 100000000,
              },
          }),
      }),
  ],
  controllers: [GroupController, ClientController, RootController, LoginController, AdminController, QRController, SurveyController, GroupAdminController, VoiceOverController],
  providers: [GoogleServiceProvider, UserService, GroupService, JournalService, ClientMediaServiceProvider, ClientService, SurveyService, PushNotificationService, SurveyAllocationService, VoiceOverServiceProvider],
})
export class AppModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(AppMiddleware)
            .forRoutes({ path: '*', method: RequestMethod.GET});
    }
}

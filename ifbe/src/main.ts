import { NestFactory, Reflector } from '@nestjs/core';
import session from 'express-session';
import {createEngine} from 'express-react-views';
import { join } from 'path';
import { NestExpressApplication } from "@nestjs/platform-express";
import createMemoryStore from 'memorystore';

import { AppModule } from './app.module';
import { RedirectFilter } from "./util/redirect";
import { RolesGuard } from "./util/guard";

const MemoryStore = createMemoryStore(session);

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(session({
    secret: 'FIXME: This should be a server configured secret, not checked in!',
    store: new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
    }),
    resave: false,
  }));
  app.setBaseViewsDir(join(__dirname, 'views'));
  app.set('view engine', 'js');
  app.engine('js', createEngine());
  app.useGlobalFilters(new RedirectFilter());
  app.useGlobalGuards(new RolesGuard(app.get(Reflector)));
  app.use ((req, res, next) => {
    res.locals.url = req.originalUrl;
    res.locals.host = req.get('host');
    res.locals.protocol = req.protocol;
    next();
  });
  await app.listen(8115);
}
bootstrap();

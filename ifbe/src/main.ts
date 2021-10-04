// Must come first.
require('dotenv').config( {path: process.env.CONFIG_SOURCE});

import { NestFactory, Reflector } from '@nestjs/core';
import session from 'express-session';
import {createEngine} from 'express-react-views';
import { join } from 'path';
import { NestExpressApplication } from "@nestjs/platform-express";
import { ValidationPipe } from '@nestjs/common';
import createMemoryStore from 'memorystore';

import { AppModule } from './app.module';
import { RedirectFilter } from "./util/redirect";
import { RolesGuard } from "./util/guard";
import csurf from 'csurf';
import bodyParser from 'body-parser';

const MemoryStore = createMemoryStore(session);

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(session({
    secret: process.env.SESSION_SECRET,
    store: new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
    }),
    saveUninitialized: false,
    resave: false,
  }));
  app.use(bodyParser.urlencoded({extended: true }));
  app.use(bodyParser.json());
  const csurfHandler = csurf();
  app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
      return next();
    } else {
      return csurfHandler(req, res, next);
    }
  });
  app.use ((req, res, next) => {
    res.locals.url = process.env.BASE_URL + req.originalUrl;
    res.locals.csrfToken = req.csrfToken && req.csrfToken();
    return next();
  });
  app.setBaseViewsDir(join(__dirname, 'views'));
  app.set('view engine', 'js');
  app.engine('js', createEngine());
  app.useGlobalFilters(new RedirectFilter());
  app.useGlobalGuards(new RolesGuard(app.get(Reflector)));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  if (process.env.BASE_URL === "http://localhost:8115") {
    app.enableCors();
  }
  await app.listen(8115);
}
bootstrap();

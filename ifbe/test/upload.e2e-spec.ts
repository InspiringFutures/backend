import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getConnectionToken } from "@nestjs/sequelize";
import { Sequelize } from 'sequelize-typescript';

import request from 'supertest';

import {Promise} from 'bluebird';
const fs = Promise.promisifyAll(require('fs'));

import { AppModule } from '../src/app.module';
import { JournalService } from "../src/service/journal.service";
import { Stream } from "stream";

async function runSQL(connection: Sequelize, path: string) {
    const data = await fs.readFileAsync(path);
    const result = await connection.query(data.toString());
}

function streamToString(stream: Stream) {
    const chunks = [];
    return new Promise((resolve, reject) => {
        stream.on('data', chunk => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    })
}

describe('Uploads from clients (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        const connection: Sequelize = app.get(getConnectionToken());
        await runSQL(connection, './test/db-clear.sql');
        await runSQL(connection, '../db-init.sql');
        await runSQL(connection, './test/db-test-data.sql');
    });

    const authClientPost = (url: string, token: string = 'CLIENT_TOKEN_1') => {
        return request(app.getHttpServer())
            .post('/api/client/1/' + url)
            .set('X-Token', token);
    }

    it('Returns 403 if no token provided', async () => {
        await authClientPost('journal', null)
            .send({
                      clientJournalId: 'arbitrary1',
                      type: 'media',
                      media: [
                          {clientMediaId: '/some/path', type: 'photo'},
                      ],
                      caption: 'Some caption',
                  })
            .expect(403)
    });

    it('Returns 403 if wrong token provided', async () => {
        await authClientPost('journal', 'invalid')
            .send({
                      clientJournalId: 'arbitrary1',
                      type: 'media',
                      media: [
                          {clientMediaId: '/some/path', type: 'photo'},
                      ],
                      caption: 'Some caption',
                  })
            .expect(403)
    });


    it('Text upload', async () => {
        await authClientPost('journal')
            .send({
                clientJournalId: 'arbitrary1',
                type: 'text',
                text: 'Some Journal entry'
            })
            .expect(201)
            .expect((res) => {
                if (res.body.clientId != 1) throw new Error("Incorrect client");
                if (!('id' in res.body)) throw new Error("missing id");
            });
    });

    it('Single photo upload', async () => {
        const TEST_MEDIA = 'TEST MEDIA';
        const url = '/some/path';

        const response = await authClientPost('journal')
            .send({
                clientJournalId: 'arbitrary1',
                type: 'media',
                media: [
                    {url, type: 'photo'},
                ],
                caption: 'Some caption',
            })
            .expect(201)
            .expect((res) => {
                if (res.body.clientId != 1) throw new Error("Incorrect client");
                if (!('id' in res.body)) throw new Error("missing id");
            });
        const journalId = response.body.id;

        const mediaResponse = await authClientPost(`journal/${journalId}/media`)
            .field('url', url)
            .attach('upload', Buffer.from(TEST_MEDIA), 'ignore the filename')
            .expect(201)
            .expect((res) => {
                if (!('id' in res.body)) throw new Error("missing id");
            });
        const journalEntryId = mediaResponse.body.id;

        const journalService = app.get(JournalService);
        expect(await streamToString(await journalService.getMedia(1, journalId, journalEntryId))).toEqual(TEST_MEDIA);
    });

    it('Multiple media upload', async () => {
        const TEST_MEDIA = 'TEST MEDIA';
        const url = '/some/path';
        const ids = [1, 2, 3];

        const response = await authClientPost('journal')
            .send({
                clientJournalId: 'arbitrary1',
                type: 'media',
                media: ids.map(id => ({url: url + id, type: 'photo'})),
                caption: 'Some caption',
            })
            .expect(201)
            .expect((res) => {
                if (res.body.clientId != 1) throw new Error("Incorrect client");
                if (!('id' in res.body)) throw new Error("missing id");
            });
        const journalId = response.body.id;

        const journalEntryIds = await Promise.map(ids, async id => ({id, journalEntryId: (await authClientPost(`journal/${journalId}/media`)
            .field('url', url + id)
            .attach('upload', Buffer.from(TEST_MEDIA + id), 'ignore the filename')
            .expect(201)).body.id}));

        const journalService = app.get(JournalService);
        journalEntryIds.forEach(async ({id, journalEntryId}) => {
            expect(await streamToString(await journalService.getMedia(1, journalId, journalEntryId))).toEqual(TEST_MEDIA + id);
        });
    });
});

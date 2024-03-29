import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getConnectionToken } from "@nestjs/sequelize";
import { Sequelize } from 'sequelize-typescript';
import http, { IncomingHttpHeaders } from 'http';

import request from 'supertest';

import {Promise} from 'bluebird';
const fs = Promise.promisifyAll(require('fs'));

import { AppModule } from '../src/app.module';
import { JournalService } from "../src/service/journal.service";
import client from '../src/views/admin/client';
import { ClientMediaService } from '../src/service/clientMedia.service';

const httpGet: (url: string) => Promise<{ body: string, headers: IncomingHttpHeaders }> = (url: string) => {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      res.setEncoding('utf8');
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({body, headers: res.headers}));
    }).on('error', reject);
  });
};

async function runSQL(connection: Sequelize, path: string) {
    const data = await fs.readFileAsync(path);
    return connection.query(data.toString());
}

const clientId = 1;
const ALLOWED_CLIENT_TOKEN = 'CLIENT_TOKEN_1';
const mediaClientJournalId = 'arbitrary1';
const TEST_MEDIA = 'TEST MEDIA';
const url = '/some/path';

describe('Uploads from clients (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        const connection: Sequelize = app.get(getConnectionToken());
        await runSQL(connection, './db-clear.sql');
        await runSQL(connection, '../../db-init.sql');
        await runSQL(connection, './db-test-data.sql');
    });

    const authClientPost = (url: string, token: string = ALLOWED_CLIENT_TOKEN) => {
        return request(app.getHttpServer())
            .post(`/api/client/${clientId}/${url}`)
            .set('X-Token', token);
    };

    it('Returns 403 if no token provided', async () => {
        await authClientPost('journal', null)
            .send({
                id: mediaClientJournalId,
                date: new Date(),
                content: {
                    type: 'media',
                    media: [
                        { clientMediaId: '/some/path', type: 'photo' },
                    ],
                    caption: 'Some caption',
                }
            })
            .expect(403)
    });

    it('Returns 403 if wrong token provided', async () => {
        await authClientPost('journal', 'invalid')
            .send({
                id: mediaClientJournalId,
                date: new Date(),
                content: {
                      type: 'media',
                      media: [
                          {clientMediaId: '/some/path', type: 'photo'},
                      ],
                      caption: 'Some caption',
                },
            })
            .expect(403)
    });


    async function uploadText() {
        return authClientPost('journal')
            .send({
                id: 'arbitraryText',
                date: new Date(),
                content: {
                    type: 'text',
                    text: 'Some Journal entry',
                },
            })
            .expect(201)
            .expect((res) => {
                if (res.body.clientId != 1) throw new Error('Incorrect client');
                if (!('id' in res.body)) throw new Error('missing id');
            });
    }

    it('Text upload', async () => {
        await uploadText();
    });

    it('Multiple text upload creates single entry', async () => {
        const journalId1 = (await uploadText()).body.id;
        const journalId2 = (await uploadText()).body.id;
        expect(journalId2).toBe(journalId1);
    });

    it('Single photo upload', async () => {
        const response = await authClientPost('journal')
            .send({
                id: mediaClientJournalId,
                date: new Date(),
                content: {
                    type: 'media',
                    media: [
                        {url, type: 'photo'},
                    ],
                    caption: 'Some caption',
                },
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
        const mediaUrl = await journalService.getMediaUrl(1, journalId, journalEntryId);
        expect((await httpGet(mediaUrl)).body).toEqual(TEST_MEDIA);
    });

    it('Multiple media upload', async () => {
        const {journalEntryIds, journalId} = await uploadMedia();

        const journalService = app.get(JournalService);
        await Promise.all(journalEntryIds.map(async ({id, journalEntryId}) => {
            const mediaUrl = await journalService.getMediaUrl(1, journalId, journalEntryId);
          const response = await httpGet(mediaUrl);
          expect(response.body).toEqual(TEST_MEDIA + id);
          expect(response.headers['x-amz-meta-xref']).toEqual('xref');
        }));
    });

    async function uploadMedia() {
        const initialIds = [1, 2, 3];
        const initialMedia = initialIds.map(id => ({ url: url + id, type: 'photo' }));

        const initialResponse = await authClientPost('journal')
            .send({
                id: mediaClientJournalId,
                date: new Date(),
                content: {
                    type: 'media',
                    media: initialMedia,
                    caption: 'Some caption',
                },
            });
        const journalId = initialResponse.body.id;

        const journalEntryIds = await Promise.map(initialIds, async id => ({
            id, journalEntryId: (await authClientPost(`journal/${journalId}/media`)
                .field('url', url + id)
                .field('xref', 'xref')
                .attach('upload', Buffer.from(TEST_MEDIA + id), 'ignore the filename')
                .expect(201)).body.id,
        }));
        return {journalId, journalEntryIds};
    }

    it('Change media upload', async () => {
        const {journalId} = await uploadMedia();

        const updatedIds = [2, 3, 4];
        const updatedMedia = updatedIds.map(id => ({url: url + id, type: 'photo'}));
        const updatedResponse = await authClientPost('journal')
            .send({
                id: mediaClientJournalId,
                date: new Date(),
                content: {
                    type: 'media',
                    media: updatedMedia,
                    caption: 'New caption',
                },
            });
        const updatedJournalId = updatedResponse.body.id;

        expect(updatedJournalId).toEqual(journalId);

        // TODO: Only upload file 4
        const journalEntryIds = await Promise.map(updatedIds, async id => ({id, journalEntryId: (await authClientPost(`journal/${updatedJournalId}/media`)
                .field('url', url + id)
                .field('xref', 'xref')
                .attach('upload', Buffer.from(TEST_MEDIA + id), 'ignore the filename')
                .expect(201)).body.id}));

        const journalService = app.get(JournalService);
        const journal = await journalService.get(clientId, updatedJournalId);
        expect(journal.entries.length).toEqual(3);
        const bodies = await Promise.all(journalEntryIds.map(async ({id, journalEntryId}) => {
            const mediaUrl = await journalService.getMediaUrl(1, updatedJournalId, journalEntryId);
            const response = await httpGet(mediaUrl);
            return response.body;
        }));
        expect(bodies).toEqual(updatedIds.map(id => TEST_MEDIA + id));
    });


    it('Can delete media journal', async () => {
        const storageService = app.get(ClientMediaService);

        const existingContents = await storageService._test_listing();

        await uploadMedia();

        await request(app.getHttpServer())
            .delete(`/api/client/${clientId}/journal`)
            .set('X-Token', ALLOWED_CLIENT_TOKEN)
            .send({
                id: mediaClientJournalId,
            })
            .expect(200);

        const newContents = await storageService._test_listing();

        expect(newContents).toEqual(existingContents);
    });
});

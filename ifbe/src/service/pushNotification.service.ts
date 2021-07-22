import PushNotifications from 'node-pushnotifications';
import { Injectable } from '@nestjs/common';

const config = {
    apn: {
        token: {
            key: process.env.APNS_P8.replace(/\\n/g, '\n'),
            keyId: process.env.APNS_KEY_ID,
            teamId: process.env.APNS_TEAM_ID,
        },
        production: process.env.DB_NAME !== "dev",
    },
    gcm: {
        id: process.env.FCM_API_KEY,
    },
    isAlwaysUseFCM: false,
};

@Injectable()
export class PushNotificationService {
    private endpoint: PushNotifications;
    constructor() {
        this.endpoint = new PushNotifications(config);
    }

    async send(tokens: string|string[], data: {title: string; body: string; custom: {customData: any}}) {
        const payload = {
            topic: process.env.APNS_BUNDLE_ID,
            priority: "high",
            retries: 1,
            pushType: "alert",
            expiry: Math.floor(Date.now() / 1000) + 7 * 86400,
            ...data,
        };
        return this.endpoint.send(tokens, payload);
    }
}

import { Client, Issuer } from "openid-client";

export class GoogleService{
    constructor(public client: Client) {}
}

export const GoogleServiceProvider = {
    provide: GoogleService,
    useFactory: async () => {
        const googleIssuer = await Issuer.discover('https://accounts.google.com');
        return new GoogleService(new googleIssuer.Client({
            client_id: process.env.GOOGLE_CLIENT_ID,
            redirect_uris: [process.env.BASE_URL + '/login/cb'],
            response_types: ['id_token'],
        }));
    },
};

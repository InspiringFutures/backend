import { Client, Issuer } from "openid-client";

export class GoogleService{
    constructor(public client: Client) {}
}

export const GoogleServiceProvider = {
    provide: GoogleService,
    useFactory: async () => {
        const googleIssuer = await Issuer.discover('https://accounts.google.com');
        console.log('Discovered issuer %s %O', googleIssuer.issuer, googleIssuer.metadata);
        return new GoogleService(new googleIssuer.Client({
            client_id: '334022523549-s5jsardff41ibchin2ndi9c5nsbg4c19.apps.googleusercontent.com',
            redirect_uris: ['http://localhost:8115/login/cb'],
            response_types: ['id_token'],
        }));
    },
};

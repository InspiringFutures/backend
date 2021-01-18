import SwiftClient from 'openstack-swift-client-region';
import { Stream } from 'stream';
import { v4 as uuidv4 } from 'uuid';

class MulterStorage {
    constructor(private storage: StorageService) {}
    _handleFile(req, file, cb) {
        this.storage.put(file.stream)
            .then(id => cb(null, {id}))
            .catch(cb);
    }

    _removeFile(req, file, cb) {
        this.storage.delete(file.id)
            .then(() => cb())
            .catch(cb);
    }
}

interface SwiftConfig {
    url: string;
    user: string;
    password: string;
    container: string;
}

export class StorageService{
    private container: SwiftClient.SwiftContainer;
    constructor(config: SwiftConfig) {
        const authenticator = new SwiftClient.SwiftAuthenticator(config.url, config.user, config.password);
        const swiftClient = new SwiftClient(authenticator);
        this.container = swiftClient.container(config.container);
    }

    async put(stream: Stream): Promise<string> {
        const id = uuidv4();
        await this.container.create(id, stream);
        return id;
    }

    async getIntoStream(id: string, stream: Stream): Promise<void> {
        await this.container.get(id, stream);
    }

    async delete(id: string): Promise<void> {
        return await this.container.delete(id);
    }

    async setMetadata(id: string, meta: object): Promise<void> {
        await this.container.update(id, meta);
    }

    multerStorage() {
        return new MulterStorage(this);
    }
}

const config: SwiftConfig = process.env.NODE_ENV === 'test' ? {
    url: 'http://ifbe_test:8050/auth/v1.0',
    user: 'test:tester',

    password: 'testing',
    container: 'client_media',
} : {
    url: 'http://ifbe_test:8055/auth/v1.0',
    user: 'test:tester',
    password: 'testing',
    container: 'client_media',
};


export const StorageServiceProvider = {
    provide: StorageService,
    useFactory: async () => {
        return new StorageService(config);
    },
};

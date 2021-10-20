import aws from 'aws-sdk';
import multerS3 from 'multer-s3';
import { v4 as uuidv4 } from 'uuid';

interface S3Config {
    url: string;
    accessKey: string;
    accessSecret: string;
    container: string;
}

const base64regex = /^data:([^;/]+\/[^;/]+);base64,/;

function extractData(dataUrl: string) {
    const matches = dataUrl.match(base64regex);
    return {
        buffer: Buffer.from(dataUrl.substring(matches[0].length), 'base64'),
        mimeType: matches[1],
    };
}

const PREFIX = 'voice-over://';

export class VoiceOverService {
    private readonly s3: aws.S3;
    constructor(private config: S3Config) {
        this.s3 = new aws.S3({
            endpoint: config.url,
            accessKeyId: config.accessKey,
            secretAccessKey: config.accessSecret,
            params: {
                Bucket: config.container,
            },
        });

        this.s3.createBucket({Bucket: this.config.container}).send();
    }

    async create(content: string): Promise<string | undefined> {
        const key = uuidv4();
        const {buffer, mimeType} = extractData(content);
        const put = await this.s3.putObject({Bucket: this.config.container, Key: key, Body: buffer, ContentType: mimeType}).promise();
        if (put.$response.error) {
            console.log("Error putting content", put.$response.error, put);
            return undefined;
        }
        return PREFIX + key;
    }

    isVoiceOver(url: string): boolean {
        return url.startsWith(PREFIX);
    }

    async getSignedUrl(id: string): Promise<string> {
        return await this.s3.getSignedUrlPromise('getObject', {Bucket: this.config.container, Key: id});
    }

    /**
     * Rewrite any data: URLs into voice-over: URLs, in-place
     * @param json The JSON to be mutated in-place
     */
    async mutateJson(json: any) {
        const locations: [any, string][] = [];
        function walk(obj: any) {
            if (Array.isArray(obj)) {
                obj.forEach((o) => walk(o));
            } else if (typeof obj === 'object' && obj) {
                Object.keys(obj).forEach((key) => {
                    if (typeof obj[key] === 'string') {
                        if (base64regex.test(obj[key])) {
                            locations.push([obj, key]);
                        }
                    } else {
                        walk(obj[key]);
                    }
                });
            }
        }
        walk(json);
        await Promise.all(locations.map(async ([obj, key]) => {
            const content = obj[key];
            const newUrl = await this.create(content);
            if (newUrl) {
                obj[key] = newUrl;
            }
        }));
    }
}

export const VoiceOverServiceProvider = {
    provide: VoiceOverService,
    useFactory: async () => {
        return new VoiceOverService({
            url: process.env.S3_URL,
            accessKey: process.env.S3_ACCESS_KEY,
            accessSecret: process.env.S3_ACCESS_SECRET,
            container: process.env.S3_VOICE_OVER_CONTAINER,
        });
    },
};

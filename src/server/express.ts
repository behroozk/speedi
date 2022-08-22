import * as compression from 'compression';
import * as Logger from 'console';
import * as cors from 'cors';
import * as express from 'express';
import helmet from 'helmet';
import * as http from 'http';
import * as morgan from 'morgan';
import { DataStore } from '../data_store';

import * as RouteExpress from '../route/express';
import { IRouteOptions } from '../route/options.interface';
import { IServerOptions } from './http_options.interface';
import { IServer } from './index.interface';

export class ExpressServer implements IServer {
    private app: express.Express;
    private server: http.Server | undefined;
    private rateLimitDataStore = new DataStore('ratelimit');

    constructor(private options: IServerOptions) {
        if (!this.options.protocol) {
            this.options.protocol = 'http';
        }

        this.app = express();

        this.app.use(helmet());
        if (this.options.logRequests) {
            this.app.use(morgan('dev'));
        }
        this.app.use(express.urlencoded({ extended: false }));
        this.app.use(express.json());
        this.app.use(compression());
        if (this.options.allowedOrigins) {
            this.app.use(cors({
                origin: this.options.allowedOrigins,
            }));
        }
    }

    public start(): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            try {
                await this.rateLimitDataStore.start();

                this.server = this.app.listen(
                    this.options.port,
                    this.options.host,
                    () => {
                        const address: string = `${this.options.protocol}://${this.options.host}:${this.options.port}`;
                        Logger.log(`server running at ${address}`);
                        resolve(true);
                    });
            } catch (error) {
                reject(error);
            }
        });
    }

    public stop(): Promise<boolean> {
        return new Promise(async (resolve) => {
            await this.rateLimitDataStore.stop();

            if (!this.server) {
                return resolve(false);
            }

            this.server.close(() => {
                Logger.log(`stopped server at ${this.options.host}:${this.options.port}`);
                this.server = undefined;
                resolve(true);
            });
        });
    }

    public addRoutes(routeObjects: IRouteOptions[] | IRouteOptions): void {
        this.app.use(RouteExpress.generate(routeObjects, this.rateLimitDataStore));
    }

    public getRawApp(): express.Express {
        return this.app;
    }
}

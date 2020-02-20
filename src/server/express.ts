import * as compression from 'compression';
import * as Logger from 'console';
import * as cors from 'cors';
import * as express from 'express';
import * as helmet from 'helmet';
import * as http from 'http';
import * as morgan from 'morgan';

import * as RouteExpress from '../route/express';
import { IRouteOptions } from '../route/options.interface';
import { IServerOptions } from './http_options.interface';
import { IServer } from './index.interface';

export class ExpressServer implements IServer {
    private app: express.Express;
    private server: http.Server | undefined;

    constructor(private options: IServerOptions) {
        if (!this.options.protocol) {
            this.options.protocol = 'http';
        }

        this.app = express();

        this.app.use(helmet());
        this.app.use(morgan('dev'));
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
        return new Promise((resolve, reject) => {
            try {
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
        return new Promise((resolve, reject) => {
            if (!this.server) {
                return resolve(false);
            }

            this.server.close(() => {
                Logger.log(`stopped server at ${this.options.host}:${this.options.port}`);
                resolve(true);
            });
        });
    }

    public addRoutes(routeObjects: IRouteOptions[] | IRouteOptions): void {
        this.app.use(RouteExpress.generate(routeObjects));
    }

    public getRawApp(): express.Express {
        return this.app;
    }
}

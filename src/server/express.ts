import * as bodyParser from 'body-parser';
import * as compression from 'compression';
import * as Logger from 'console';
import * as express from 'express';
import * as helmet from 'helmet';
import * as http from 'http';
import * as morgan from 'morgan';

import { RouteExpress } from '../route/express';
import { IRouteOptions } from '../route/options.interface';
import { IHttpServerOptions } from './http_options.interface';
import { IServer } from './index.interface';

export class ExpressServer implements IServer {
    private app: express.Express;
    private server: http.Server | undefined;

    constructor(private options: IHttpServerOptions) {
        if (!this.options.protocol) {
            this.options.protocol = 'http';
        }

        this.app = express();

        this.app.use(helmet());
        this.app.use(morgan('dev'));
        this.app.use(bodyParser.urlencoded({ extended: false }));
        this.app.use(bodyParser.json());
        this.app.use(compression());
        // Adding CORS headers
        this.app.use(function (req, res, next) {
          let allowedOrigins = [
              'https://dashboard.supplyhub.com',
              'https://dev-dashboard.supplyhub.com',
              'http://localhost:4200'
          ];
          let origin = req.headers.origin;
          if (allowedOrigins.indexOf(origin) > -1) {
              res.setHeader('Access-Control-Allow-Origin', origin);
          }
          res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
          res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
          res.header('Access-Control-Allow-Credentials', true);
          return next();
        });
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
}

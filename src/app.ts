import * as bodyParser from 'body-parser';
import * as compression from 'compression';
import * as express from 'express';
import * as helmet from 'helmet';
import * as http from 'http';
import * as morgan from 'morgan';
import CONFIG from './config/config';
import { Route } from './route/';
import { IRouteOptions } from './route/options.interface';

export class App {
    private readonly app: express.Express;
    private server: http.Server;

    constructor(
        public host: string = CONFIG.app.host,
        public port: string = CONFIG.app.port,
    ) {
        this.app = express();

        this.app.use(helmet());
        this.app.use(morgan('dev'));
        this.app.use(bodyParser.urlencoded({ extended: false }));
        this.app.use(bodyParser.json());
        this.app.use(compression());

        this.addFixedRoutes();
    }

    public startServer(): void {
        this.server = this.app.listen(Number(this.port), this.host, () => {
            const a = 1;
        });
    }

    public getServer(): http.Server {
        return this.server;
    }

    public addRoutes(routeObjects: IRouteOptions | IRouteOptions[]): void {
        const route = new Route();
        route.setupRoutes(routeObjects);
        this.mountRouter(route.getRouter());
    }

    public mountRouter(router: express.Router): void {
        this.app.use(router);
    }

    private addFixedRoutes(): void {
        this.app.get('/health', (req, res) => {
            res.json({
                health: 'OK',
                time: Date.now(),
            });
        });
    }
}

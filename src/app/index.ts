import { RouteMethod } from '../../index';
import { IRouteOptions } from '../route/options.interface';
import { ExpressServer } from '../server/express';
import { IServer } from '../server/index.interface';
import { ServerType } from '../server/type.enum';
import { IAppOptions } from './options.interface';

export class App {
    private name: string;
    private server: IServer;

    constructor(private options: IAppOptions) {
        this.name = options.name;

        switch (options.serverType) {
            case ServerType.Express:
                this.server = new ExpressServer(options.httpOptions);
                break;
            default:
                throw new Error('Unknown server');
        }
    }

    public async run(): Promise<boolean> {
        this.addMonitoringRoutes();

        return this.server.start();
    }

    public addRoutes(routeObjects: IRouteOptions | IRouteOptions[]): void {
        this.server.addRoutes(routeObjects);
    }

    public getRawApp(): any {
        return this.server.getRawApp();
    }

    private addMonitoringRoutes(): void {
        this.addRoutes({
            controller: async () => {
                return {
                    health: 'OK',
                    memory: process.memoryUsage().rss,
                    name: this.name,
                    time: Date.now(),
                };
            },
            description: 'health check',
            method: RouteMethod.Get,
            path: '/health',
        });
    }
}

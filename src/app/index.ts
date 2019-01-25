import { RouteMethod } from '../../index';
import { IRouteOptions } from '../route/options.interface';
import { ExpressServer } from '../server/express';
import { IServer } from '../server/index.interface';
import { IAppOptions } from './options.interface';

export class App {
    private name: string;
    private servers: IServer[] = [];

    constructor(private options: IAppOptions) {
        this.name = options.name;

        if (options.http) {
            this.servers.push(new ExpressServer(options.http));
        }
    }

    public async run(): Promise<void> {
        this.addMonitoringRoutes();

        const promises = this.servers.map((server) => server.start());
        const result = await Promise.all(promises);
    }

    public addRoutes(routeObjects: IRouteOptions | IRouteOptions[]): void {
        for (const server of this.servers) {
            server.addRoutes(routeObjects);
        }
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
            name: 'health',
            path: '/health',
        });
    }
}

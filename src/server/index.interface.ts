import { IRouteOptions } from '../route/options.interface';

export interface IServer {
    start(): Promise<boolean>;
    stop(): Promise<boolean>;
    addRoutes(routeObjects: IRouteOptions | IRouteOptions[]): void;
    getRawApp(): any;
}

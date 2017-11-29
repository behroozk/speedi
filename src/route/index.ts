import * as express from 'express';
import { Authentication } from '../authentication/';
import { Cacher } from '../cacher/';
import { PayloadValidator } from '../payload_validator/';
import { RateLimiter } from '../rate_limitter/';
import { RouteMethod } from './method.enum';
import { IRouteOptions } from './options.interface';

export class Route {
    private router: express.Router = express.Router();

    public setupRoute(routeObject: IRouteOptions): void {
        const middlewares: express.RequestHandler[] = [];

        if (routeObject.authentication) {
            middlewares.push(Authentication.verify(routeObject.authentication));
        }

        if (routeObject.validate) {
            middlewares.push(PayloadValidator.run(routeObject.validate));
        }

        if (routeObject.rateLimit) {
            middlewares.push(RateLimiter.setup(routeObject.rateLimit));
        }

        if (routeObject.cache) {
            middlewares.push(Cacher.retrieveOrCache(routeObject.cache));
        }

        middlewares.push(routeObject.controller);

        switch (routeObject.method) {
            case RouteMethod.Get:
                this.router.get(routeObject.path, middlewares);
                break;
            case RouteMethod.Post:
                this.router.post(routeObject.path, middlewares);
                break;
            case RouteMethod.Put:
                this.router.put(routeObject.path, middlewares);
                break;
            case RouteMethod.Patch:
                this.router.patch(routeObject.path, middlewares);
                break;
            case RouteMethod.Delete:
                this.router.delete(routeObject.path, middlewares);
                break;
            default:
                throw new Error(`undefined route method: ${routeObject.method}`);
        }
    }

    public setupRoutes(routeObjects: IRouteOptions | IRouteOptions[]): void {
        if (!Array.isArray(routeObjects)) {
            return this.setupRoute(routeObjects);
        }

        for (const routeObject of routeObjects) {
            this.setupRoute(routeObject);
        }
    }

    public getRouter(): express.Router {
        return this.router;
    }
}

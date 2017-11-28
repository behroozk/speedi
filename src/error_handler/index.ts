import * as express from 'express';
import * as http from 'http';

export class ErrorHandler {
    public static badRequest(
        res: express.Response,
        message = 'bad request',
        metadata = {},
    ) {
        this.jsonify(res, 400, message, metadata);
    }

    public static unauthorized(
        res: express.Response,
        message = 'unauthorized',
        metadata = {},
    ): void {
        this.jsonify(res, 401, message, metadata);
    }

    public static forbidden(
        res: express.Response,
        message = 'forbidden',
        metadata = {},
    ): void {
        this.jsonify(res, 403, message, metadata);
    }

    public static notFound(
        res: express.Response,
        message = 'not found',
        metadata = {},
    ): void {
        this.jsonify(res, 404, message, metadata);
    }

    public static tooManyRequests(
        res: express.Response,
        message = 'too many requests',
        metadata: any = {},
    ): void {
        if (metadata.retryAfter) {
            res.set('Retry-After', metadata.retryAfter);
        }
        this.jsonify(res, 429, message, metadata);
    }

    public static unknown(
        res: express.Response,
        message = 'internal server error',
        metadata = {},
    ): void {
        this.jsonify(res, 500, message, metadata);
    }

    private static jsonify(
        res: express.Response,
        code: number = 500,
        error: Error | string = 'unexpected error',
        metadata: object,
    ): void {
        if (!res) { return; }

        const response = {
            code,
            message: (error instanceof Error) ? error.message : error,
            metadata: {},
            status: http.STATUS_CODES[code.toString()],
        };

        // TODO: if (CONFIG.node_env === 'development') { response.metadata = metadata; }

        res.status(code)
            .json(response)
            .end();
    }
}

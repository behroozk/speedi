import * as express from 'express';
import * as Joi from 'joi';
import { ErrorHandler } from '../error_handler/';
import { IPayloadValidatorOptions } from './options.interface';

export class PayloadValidator {
    public static run(schema: IPayloadValidatorOptions): express.RequestHandler {
        return (req: express.Request, res: express.Response, next: express.NextFunction): void => {
            const payload: IPayloadValidatorOptions = {};

            if (schema.params) { payload.params = req.params; }
            if (schema.body) { payload.body = req.body; }
            if (schema.query) { payload.query = req.query; }

            const result = Joi.validate(payload, schema, { stripUnknown: true });

            if (result.error) {
                ErrorHandler.badRequest(res, result.error.message, result.error.details);
            } else {
                if (result.value.params) { req.params = result.value.params; }
                if (result.value.body) { req.body = result.value.body; }
                if (result.value.query) { req.query = result.value.query; }

                next();
            }
        };
    }
}

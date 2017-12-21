import * as Joi from 'joi';

import { RequestError } from '../error/request';
import { ErrorType } from '../error/type.enum';

export class Payload {
    public static validate(payload: any, schema: Joi.SchemaMap): any {
        const result = Joi.validate(payload, schema, { stripUnknown: true });

        if (result.error) {
            throw new RequestError(ErrorType.BadRequest, 'Invalid payload', result.error.details);
        }

        return result.value;
    }
}

import * as Ajv from 'ajv';
import * as Joi from 'joi';

import { RequestError } from '../error/request';
import { ErrorType } from '../error/type.enum';

const ajv = new Ajv({
    allErrors: true,
    coerceTypes: true,
    removeAdditional: 'all',
    useDefaults: true,
});

export function validateJoi(payload: any, schema: Joi.SchemaMap): any {
    const result = Joi.validate(payload, schema, { stripUnknown: true });

    if (result.error) {
        throw new RequestError(ErrorType.BadRequest, 'Invalid payload', result.error.details);
    }

    return result.value;
}

export function validateJsonSchema(payload: any, schema: any): any {
    const validate = ajv.compile(schema);

    const validatedPayload = validate(payload);

    if (validatedPayload) {
        return payload;
    } else {
        throw new RequestError(ErrorType.BadRequest, 'Invalid payload', validate.errors);
    }
}

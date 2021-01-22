import Ajv from 'ajv';
import AjvFormats from "ajv-formats"
import { JSONSchema7 } from 'json-schema';

import { RequestError } from '../error/request';
import { ErrorType } from '../error/type.enum';

const ajv = new Ajv({
    allErrors: true,
    coerceTypes: true,
    removeAdditional: 'all',
    useDefaults: true,
});
AjvFormats(ajv);

export function validateJsonSchema(payload: any, schema: JSONSchema7): any {
    const validate = ajv.compile(schema);

    const validatedPayload = validate(payload);

    if (validatedPayload) {
        return payload;
    } else {
        throw new RequestError(ErrorType.BadRequest, 'Invalid payload', validate.errors);
    }
}

import * as Joi from 'joi';

export interface IPayloadValidatorOptions {
    params?: Joi.SchemaMap;
    body?: Joi.SchemaMap;
    query?: Joi.SchemaMap;
}

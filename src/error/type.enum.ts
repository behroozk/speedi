export enum ErrorType {
    BadRequest = 400,
    Unauthorized = 401,
    PaymentRequired = 402,
    Forbidden = 403,
    NotFound = 404,
    RequestTimeout = 408,
    TooManyRequests = 429,
    InternalServerError = 500,
}

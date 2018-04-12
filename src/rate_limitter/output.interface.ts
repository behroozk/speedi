export interface IRateLimitterOutput {
    requestsAllowedBeforeLimit: number;
    waitTime: number;
    requests: number;
    responseDelayTime: number;
}

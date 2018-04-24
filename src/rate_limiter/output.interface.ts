export interface IRateLimiterOutput {
    requestsAllowedBeforeLimit: number;
    waitTime: number;
    requests: number;
    responseDelayTime: number;
}

export interface IRateLimitterOutput {
    allowedBeforeLimit: number;
    duration: number;
    requests: number;
    waitTime: number;
}

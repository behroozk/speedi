export interface IAuthenticationOptions {
    authenticators: Array<(token: any, payload: any) => Promise<boolean>>;
}

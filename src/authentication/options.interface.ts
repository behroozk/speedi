export interface IAuthenticationOptions {
    authenticators: Array<(token: any) => Promise<boolean>>;
}

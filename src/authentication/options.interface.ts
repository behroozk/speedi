export interface IAuthenticationOptions {
    authenticator: (token: any) => Promise<boolean>;
}

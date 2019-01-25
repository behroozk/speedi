export interface IAuthenticationOptions {
    authenticators: Array<(token: NonNullable<any>, payload: any) => Promise<boolean>>;
}

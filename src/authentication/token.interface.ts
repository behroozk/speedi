export interface IAuthenticationToken {
    [key: string]: any;
    roles: string[];
    issuedAt: number;
    lastAccess: number;
}

export declare function hashPassword(password: string): Promise<string>;
export declare function verifyPassword(password: string, storedPassword: string): Promise<{
    valid: boolean;
    needsRehash: boolean;
}>;

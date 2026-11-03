export declare const ROLES_KEY = "allowedRoles";
export type AppRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
export declare const Roles: (...roles: AppRole[]) => import("@nestjs/common").CustomDecorator<string>;

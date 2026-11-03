import type { PaginationQueryDto } from './pagination-query.dto';
export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export declare function paginate<T>(query: PaginationQueryDto, findPage: (skip: number, take: number) => Promise<T[]>, count: () => Promise<number>): Promise<PaginatedResponse<T>>;

import type { Request } from 'express';
import { ApiHistoryService } from './apihistory.service';
import { CreateApiHistoryDto } from './dto/create-apihistory.dto';
import { UpdateApiHistoryDto } from './dto/update-apihistory.dto';
import type { ApiHistory } from '@prisma/client';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import type { PaginatedResponse } from '../common/pagination/paginate';
export declare class ApiHistoryController {
    private readonly service;
    constructor(service: ApiHistoryService);
    create(dto: CreateApiHistoryDto, request: Request & {
        user: {
            id: string;
        };
    }): Promise<ApiHistory>;
    findAll(query: PaginationQueryDto): Promise<PaginatedResponse<ApiHistory>>;
    findOne(id: string): Promise<ApiHistory>;
    update(id: string, dto: UpdateApiHistoryDto): Promise<ApiHistory>;
    remove(id: string): Promise<ApiHistory>;
}

import { PrismaService } from '../prisma/prisma.service';
import { CreateApiHistoryDto } from './dto/create-apihistory.dto';
import { UpdateApiHistoryDto } from './dto/update-apihistory.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { type PaginatedResponse } from '../common/pagination/paginate';
import type { ApiHistory } from '@prisma/client';
export declare class ApiHistoryService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateApiHistoryDto, userId: string): Promise<ApiHistory>;
    findAll(query: PaginationQueryDto): Promise<PaginatedResponse<ApiHistory>>;
    findOne(id: string): Promise<ApiHistory>;
    update(id: string, dto: UpdateApiHistoryDto): Promise<ApiHistory>;
    remove(id: string): Promise<ApiHistory>;
}

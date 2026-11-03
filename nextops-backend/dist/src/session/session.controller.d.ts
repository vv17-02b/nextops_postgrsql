import { SessionService } from './session.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import type { Session } from '@prisma/client';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import type { PaginatedResponse } from '../common/pagination/paginate';
export declare class SessionController {
    private readonly service;
    constructor(service: SessionService);
    create(dto: CreateSessionDto): Promise<Session>;
    findAll(query: PaginationQueryDto): Promise<PaginatedResponse<Session>>;
    findOne(id: string): Promise<Session>;
    update(id: string, dto: UpdateSessionDto): Promise<Session>;
    remove(id: string): Promise<Session>;
}

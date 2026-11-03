import { UserAiBudgetService } from './useraibudget.service';
import { CreateUserAiBudgetDto } from './dto/create-useraibudget.dto';
import { UpdateUserAiBudgetDto } from './dto/update-useraibudget.dto';
import type { UserAiBudget } from '@prisma/client';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import type { PaginatedResponse } from '../common/pagination/paginate';
export declare class UserAiBudgetController {
    private readonly service;
    constructor(service: UserAiBudgetService);
    create(dto: CreateUserAiBudgetDto): Promise<UserAiBudget>;
    findAll(query: PaginationQueryDto): Promise<PaginatedResponse<UserAiBudget>>;
    findOne(id: string): Promise<UserAiBudget>;
    update(id: string, dto: UpdateUserAiBudgetDto): Promise<UserAiBudget>;
    remove(id: string): Promise<UserAiBudget>;
}

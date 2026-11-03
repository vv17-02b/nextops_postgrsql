import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import type { Account } from '@prisma/client';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import type { PaginatedResponse } from '../common/pagination/paginate';
export declare class AccountController {
    private readonly accountService;
    constructor(accountService: AccountService);
    create(dto: CreateAccountDto): Promise<Account>;
    findAll(query: PaginationQueryDto): Promise<PaginatedResponse<Account>>;
    findOne(id: string): Promise<Account>;
    update(id: string, dto: UpdateAccountDto): Promise<Account>;
    remove(id: string): Promise<Account>;
}

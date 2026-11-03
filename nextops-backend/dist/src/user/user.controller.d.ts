import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import type { PaginatedResponse } from '../common/pagination/paginate';
import type { SafeUser } from './user.service';
export declare class UserController {
    private readonly service;
    constructor(service: UserService);
    create(dto: CreateUserDto): Promise<SafeUser>;
    findAll(query: PaginationQueryDto): Promise<PaginatedResponse<SafeUser>>;
    findOne(id: string): Promise<SafeUser>;
    update(id: string, dto: UpdateUserDto): Promise<SafeUser>;
    remove(id: string): Promise<SafeUser>;
}

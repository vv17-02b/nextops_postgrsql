import { VerificationTokenService } from './verificationtoken.service';
import { CreateVerificationTokenDto } from './dto/create-verificationtoken.dto';
import { UpdateVerificationTokenDto } from './dto/update-verificationtoken.dto';
import type { VerificationToken } from '@prisma/client';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import type { PaginatedResponse } from '../common/pagination/paginate';
export declare class VerificationTokenController {
    private readonly service;
    constructor(service: VerificationTokenService);
    create(dto: CreateVerificationTokenDto): Promise<VerificationToken>;
    findAll(query: PaginationQueryDto): Promise<PaginatedResponse<VerificationToken>>;
    findOne(id: string): Promise<VerificationToken>;
    update(id: string, dto: UpdateVerificationTokenDto): Promise<VerificationToken>;
    remove(id: string): Promise<VerificationToken>;
}

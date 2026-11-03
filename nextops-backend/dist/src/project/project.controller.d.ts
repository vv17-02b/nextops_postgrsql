import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import type { Project } from '@prisma/client';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import type { PaginatedResponse } from '../common/pagination/paginate';
export declare class ProjectController {
    private readonly service;
    constructor(service: ProjectService);
    create(dto: CreateProjectDto): Promise<Project>;
    findAll(query: PaginationQueryDto): Promise<PaginatedResponse<Project>>;
    findOne(id: string): Promise<Project>;
    update(id: string, dto: UpdateProjectDto): Promise<Project>;
    remove(id: string): Promise<Project>;
}

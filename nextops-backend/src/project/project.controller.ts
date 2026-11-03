import { Controller, Get, Post, Body, Param, Delete, Patch, Inject, Query } from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import type { Project } from '@prisma/client';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import type { PaginatedResponse } from '../common/pagination/paginate';

@Controller('project')
export class ProjectController {
  constructor(
    @Inject(ProjectService)
    private readonly service: ProjectService
  ) {}

  @Post()
  create(@Body() dto: CreateProjectDto): Promise<Project> { 
    return this.service.create(dto); 
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto): Promise<PaginatedResponse<Project>> {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Project> { 
    return this.service.findOne(id); 
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto): Promise<Project> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<Project> { 
    return this.service.remove(id); 
  }
}

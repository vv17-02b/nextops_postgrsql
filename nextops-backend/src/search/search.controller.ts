import { Controller, Get, Inject, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { RateLimit } from '../auth/rate-limit.guard';
import { SearchService, type GlobalSearchResponse } from './search.service';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    companyId?: string;
  };
}

@Controller('search')
export class SearchController {
  constructor(
    @Inject(SearchService)
    private readonly searchService: SearchService,
  ) {}

  @Get()
  @RateLimit(90, 60)
  search(
    @Query('q') q: string | undefined,
    @Req() req: RequestWithUser,
  ): Promise<GlobalSearchResponse> {
    return this.searchService.searchWorkspace(q ?? '', req.user?.companyId);
  }
}

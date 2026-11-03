import { BadRequestException } from '@nestjs/common';
import type { PaginationQueryDto } from './pagination-query.dto';

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function paginate<T>(
  query: PaginationQueryDto,
  findPage: (skip: number, take: number) => Promise<T[]>,
  count: () => Promise<number>,
): Promise<PaginatedResponse<T>> {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 20);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new BadRequestException({
      message: 'Pagination parameters are invalid.',
      errorCode: 'INVALID_PAGINATION',
      errors: [],
    });
  }
  const [data, total] = await Promise.all([
    findPage((page - 1) * limit, limit),
    count(),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedCollection<T> {
  data: T[];
  meta: PaginationMeta | null;
}

export async function readPaginatedCollection<T>(
  response: Response,
): Promise<PaginatedCollection<T>> {
  const payload: unknown = await response.json();

  if (Array.isArray(payload)) {
    return { data: payload as T[], meta: null };
  }

  if (typeof payload !== 'object' || payload === null || !('data' in payload)) {
    throw new Error('The API returned an invalid paginated collection.');
  }

  const collection = payload as { data: unknown; meta?: unknown };
  if (!Array.isArray(collection.data)) {
    throw new Error('The API returned an invalid collection data field.');
  }

  const meta = collection.meta;
  if (
    typeof meta !== 'object' ||
    meta === null ||
    !('page' in meta) ||
    !('limit' in meta) ||
    !('total' in meta) ||
    !('totalPages' in meta)
  ) {
    throw new Error('The API returned invalid pagination metadata.');
  }

  const pagination = meta as Record<string, unknown>;
  if (
    !Number.isInteger(pagination.page) ||
    !Number.isInteger(pagination.limit) ||
    !Number.isInteger(pagination.total) ||
    !Number.isInteger(pagination.totalPages)
  ) {
    throw new Error('The API returned invalid pagination metadata.');
  }

  return {
    data: collection.data as T[],
    meta: {
      page: pagination.page as number,
      limit: pagination.limit as number,
      total: pagination.total as number,
      totalPages: pagination.totalPages as number,
    },
  };
}

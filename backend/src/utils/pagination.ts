import { PaginationQuery } from '../types/api';

export function parsePagination(query: Record<string, unknown>): Required<PaginationQuery> {
  const page = Math.max(1, parseInt(String(query.page ?? '1'), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? '20'), 10) || 20));
  const sortBy = String(query.sortBy ?? 'createdAt');
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : ('desc' as const);
  const search = String(query.search ?? '');

  return { page, limit, sortBy, sortOrder, search };
}

export function buildPaginationMeta(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

export function getSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}

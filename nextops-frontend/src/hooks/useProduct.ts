import type { CreateProductInput, Product } from '@/types/api';
import { usePaginatedResource } from './usePaginatedResource';
export type { CreateProductInput, Product };

export function useProduct() {
  return usePaginatedResource<Product, CreateProductInput>('/api/product', 20);
}

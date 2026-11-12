import type { CreateOrderInput, Order } from '@/types/api';
import { usePaginatedResource } from './usePaginatedResource';
export type { CreateOrderInput, Order };

export function useOrder() {
  return usePaginatedResource<Order, CreateOrderInput>('/api/order', 20);
}

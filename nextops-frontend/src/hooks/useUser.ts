import type { CreateUserInput, User } from '@/types/api';
import { usePaginatedResource } from './usePaginatedResource';
export type { CreateUserInput, User };

export function useUser() {
  return usePaginatedResource<User, CreateUserInput>('/api/user', 20);
}

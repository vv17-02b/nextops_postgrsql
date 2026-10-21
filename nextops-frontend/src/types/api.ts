export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface Account {
  id: string;
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token?: string | null;
  access_token?: string | null;
  expires_at?: number | null;
  token_type?: string | null;
  scope?: string | null;
  id_token?: string | null;
  session_state?: string | null;
}

export interface CreateAccountInput {
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
}

export interface AgentKnowledgeBase {
  id: string;
  projectId: string;
  title: string;
  content: string;
  metadata?: JsonValue;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgentKnowledgeBaseInput {
  projectId: string;
  title: string;
  content: string;
}

export interface ApiHistory {
  id: string;
  endpoint: string;
  method: string;
  statusCode: number;
  requestBody?: string | null;
  responseBody?: string | null;
  durationMs: number;
  createdAt: string;
}

export interface CreateApiHistoryInput {
  endpoint: string;
  method: string;
  statusCode: number;
  durationMs: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryInput {
  name: string;
  slug: string;
  description: string;
}

export interface Order {
  id: string;
  userId: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentId?: string | null;
  paymentRawResponse?: JsonValue;
  totalAmount: number;
  currency: string;
  shippingAddress: JsonValue;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderInput {
  userId: string;
  status: string;
  totalAmount: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  compareAtPrice?: number | null;
  images: string[];
  isActive: boolean;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductInput {
  name: string;
  slug: string;
  price: number;
  categoryId: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  userId: string;
  name: string;
  description: string;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string | null;
  userId: string;
  productId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewInput {
  rating: number;
  comment: string;
  userId: string;
  productId: string;
}

export interface Session {
  id: string;
  sessionToken: string;
  userId: string;
  expires: string;
}

export interface CreateSessionInput {
  sessionToken: string;
  userId: string;
}

export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  emailVerified?: string | null;
  image?: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  role: string;
}

export interface UserAiBudget {
  id: string;
  userId: string;
  projectId?: string | null;
  totalBudget: number;
  usedBudget: number;
  currency: string;
  resetDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserAiBudgetInput {
  userId: string;
  totalBudget: number;
  usedBudget: number;
  currency: string;
}

export interface VerificationToken {
  id: string;
  identifier: string;
  token: string;
  expires: string;
}

export interface CreateVerificationTokenInput {
  identifier: string;
  token: string;
}

export interface Warehouse {
  id: string;
  productId?: string;
  name?: string;
  location: string;
  quantity?: number;
  description?: string;
  updatedAt?: string;
}

export interface CreateWarehouseInput {
  name: string;
  location: string;
  description?: string;
}

export interface WebhookConfig {
  id: string;
  projectId: string;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWebhookConfigInput {
  projectId: string;
  url: string;
  secret: string;
}

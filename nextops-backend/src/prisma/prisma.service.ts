import { BadRequestException, ForbiddenException, Inject, Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { TenantContext } from './tenant-context';

const TENANT_MODELS = new Set([
  'account',
  'agentKnowledgeBase',
  'apiHistory',
  'category',
  'invitation',
  'order',
  'orderItem',
  'product',
  'project',
  'review',
  'session',
  'user',
  'userAiBudget',
  'verificationToken',
  'warehouse',
  'webhookConfig',
]);

const READ_AND_MUTATE_WHERE_OPERATIONS = new Set([
  'findUnique',
  'findUniqueOrThrow',
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
  'update',
  'updateMany',
  'delete',
  'deleteMany',
  'upsert',
]);

function delegateName(model: string): string {
  return model.charAt(0).toLowerCase() + model.slice(1);
}

const TENANT_REFERENCES: Record<string, Record<string, string>> = {
  Account: { userId: 'User' },
  AgentKnowledgeBase: { projectId: 'Project' },
  ApiHistory: { userId: 'User' },
  Category: { parentId: 'Category' },
  Order: { userId: 'User' },
  OrderItem: { orderId: 'Order', productId: 'Product' },
  Product: { categoryId: 'Category' },
  Project: { userId: 'User' },
  Review: { userId: 'User', productId: 'Product' },
  Session: { userId: 'User' },
  UserAiBudget: { userId: 'User', projectId: 'Project' },
  Warehouse: { productId: 'Product' },
  WebhookConfig: { projectId: 'Project' },
};

const TENANT_NESTED_MODELS: Record<string, Record<string, string>> = {
  Order: { items: 'OrderItem' },
};

function referenceIds(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(referenceIds);
  if (typeof value !== 'object' || value === null) return [];

  if ('connect' in value) return referenceIds(value.connect);
  if ('set' in value) return referenceIds(value.set);
  if ('id' in value && typeof value.id === 'string') return [value.id];
  return [];
}

function nestedWrites(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'object' || value === null) return [];

  const writes: unknown[] = [];
  if ('create' in value) writes.push(value.create);
  if ('createMany' in value && typeof value.createMany === 'object' && value.createMany !== null && 'data' in value.createMany) {
    writes.push(value.createMany.data);
  }
  if ('connectOrCreate' in value && typeof value.connectOrCreate === 'object' && value.connectOrCreate !== null && 'create' in value.connectOrCreate) {
    writes.push(value.connectOrCreate.create);
  }
  return writes;
}

function addNestedTenantData(value: unknown, model: string, companyId: string): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => addTenantToData(entry, companyId, model));
  }
  if (typeof value !== 'object' || value === null) return value;

  const nested = value as Record<string, unknown>;
  const unsupportedOperations = Object.keys(nested).filter(
    (operation) => !['create', 'createMany'].includes(operation),
  );
  if (unsupportedOperations.length > 0) {
    throw new BadRequestException('This nested relationship operation is not supported for tenant-scoped records.');
  }

  const scoped = { ...nested };
  if ('create' in nested) scoped.create = addTenantToData(nested.create, companyId, model);
  if ('createMany' in nested && typeof nested.createMany === 'object' && nested.createMany !== null) {
    const createMany = nested.createMany as Record<string, unknown>;
    scoped.createMany = {
      ...createMany,
      data: addTenantToData(createMany.data, companyId, model),
    };
  }
  return scoped;
}

async function assertTenantRecord(
  client: object,
  model: string,
  id: string,
  companyId: string,
): Promise<void> {
  const delegate = Reflect.get(client, delegateName(model));
  const findFirst: unknown = Reflect.get(delegate, 'findFirst');
  if (typeof findFirst !== 'function') {
    throw new Error(`Prisma model ${model} does not support tenant reference checks.`);
  }
  const record = await Reflect.apply(findFirst, delegate, [{
    where: { id, companyId },
    select: { id: true },
  }]);
  if (!record) {
    throw new BadRequestException('A referenced record is not available in this business workspace.');
  }
}

async function validateTenantRelations(
  client: object,
  model: string,
  data: unknown,
  companyId: string,
): Promise<void> {
  const modelName = model.charAt(0).toUpperCase() + model.slice(1);
  const records = Array.isArray(data) ? data : [data];
  for (const record of records) {
    if (typeof record !== 'object' || record === null) continue;

    const values = record as Record<string, unknown>;
    const checks: Promise<void>[] = [];
    for (const [field, relatedModel] of Object.entries(TENANT_REFERENCES[modelName] ?? {})) {
      for (const id of referenceIds(values[field])) {
        checks.push(assertTenantRecord(client, relatedModel, id, companyId));
      }
    }

    for (const [field, nestedModel] of Object.entries(TENANT_NESTED_MODELS[modelName] ?? {})) {
      for (const nestedData of nestedWrites(values[field])) {
        checks.push(validateTenantRelations(client, nestedModel, nestedData, companyId));
      }
    }
    await Promise.all(checks);
  }
}

function addTenantToWhere(where: unknown, companyId: string): Record<string, unknown> {
  return {
    ...(typeof where === 'object' && where !== null ? where : {}),
    companyId,
  };
}

function addTenantToData(data: unknown, companyId: string, model?: string): unknown {
  if (Array.isArray(data)) {
    return data.map((entry) => addTenantToData(entry, companyId, model));
  }

  if (typeof data === 'object' && data !== null) {
    const scoped = { ...data, companyId } as Record<string, unknown>;
    if (model) {
      const modelName = model.charAt(0).toUpperCase() + model.slice(1);
      for (const [field, nestedModel] of Object.entries(TENANT_NESTED_MODELS[modelName] ?? {})) {
        if (field in scoped) {
          scoped[field] = addNestedTenantData(scoped[field], nestedModel, companyId);
        }
      }
    }
    return scoped;
  }

  return data;
}
function wrapTenantClient<T extends object>(client: T, tenantContext: TenantContext): T {
  return new Proxy(client, {
    get(target, property, receiver) {
      const value: unknown = Reflect.get(target, property, receiver);

      if (property === '$transaction' && typeof value === 'function') {
        return (input: unknown, ...options: unknown[]) => {
          if (typeof input === 'function') {
            return Reflect.apply(value, target, [
              (transactionClient: object) => {
                const scopedTransaction = wrapTenantClient(transactionClient, tenantContext);
                return input(scopedTransaction);
              },
              ...options,
            ]);
          }

          if (!tenantContext.isTenantBypassed() && !tenantContext.getCompanyId()) {
            throw new ForbiddenException('Batch transactions require an active business workspace.');
          }

          return Reflect.apply(value, target, [input, ...options]);
        };
      }

      if (typeof property !== 'string' || !TENANT_MODELS.has(property)) {
        return value;
      }

      return new Proxy(value as object, {
        get(delegate, operation, delegateReceiver) {
          const method: unknown = Reflect.get(delegate, operation, delegateReceiver);
          if (typeof operation !== 'string' || typeof method !== 'function') {
            return method;
          }

          return async (...parameters: unknown[]) => {
            if (tenantContext.isTenantBypassed()) {
              return await Reflect.apply(method, delegate, parameters);
            }

            const companyId = tenantContext.getCompanyId();
            if (!companyId) {
              throw new ForbiddenException(`Access to ${property}.${operation} requires an active business workspace.`);
            }

            const rawFirstParam = parameters[0];
            if (rawFirstParam !== undefined && (typeof rawFirstParam !== 'object' || rawFirstParam === null)) {
              throw new BadRequestException(`Invalid query arguments for ${property}.${operation}.`);
            }

            const args = rawFirstParam ? { ...(rawFirstParam as Record<string, unknown>) } : {};

            if (READ_AND_MUTATE_WHERE_OPERATIONS.has(operation)) {
              args.where = addTenantToWhere(args.where, companyId);
            } else if (!['create', 'createMany', 'createManyAndReturn'].includes(operation)) {
              throw new ForbiddenException(`Operation ${property}.${operation} is not permitted in tenant-scoped mode.`);
            }

            if (operation === 'create' || operation === 'createMany' || operation === 'createManyAndReturn') {
              args.data = addTenantToData(args.data, companyId, property);
            } else if (operation === 'upsert') {
              args.create = addTenantToData(args.create, companyId, property);
              if (typeof args.update === 'object' && args.update !== null) {
                const update = { ...(args.update as Record<string, unknown>) };
                delete update.companyId;
                args.update = update;
              }
            } else if (typeof args.data === 'object' && args.data !== null) {
              const data = { ...(args.data as Record<string, unknown>) };
              delete data.companyId;
              args.data = data;
            }

            if (['create', 'createMany', 'createManyAndReturn', 'update', 'updateMany'].includes(operation)) {
              await validateTenantRelations(target, property, args.data, companyId);
            } else if (operation === 'upsert') {
              await validateTenantRelations(target, property, args.create, companyId);
              await validateTenantRelations(target, property, args.update, companyId);
            }

            return await Reflect.apply(method, delegate, [args, ...parameters.slice(1)]);
          };
        },
      });
    },
  });
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly tenantContext: TenantContext;

  constructor(@Inject(TenantContext) tenantContext: TenantContext) {
    super();
    this.tenantContext = tenantContext;
    return wrapTenantClient(this, tenantContext);
  }

  runSystemQuery<T>(fn: () => T): T {
    return this.tenantContext.runWithoutTenant(fn);
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

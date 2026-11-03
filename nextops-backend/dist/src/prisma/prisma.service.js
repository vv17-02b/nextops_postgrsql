"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const tenant_context_1 = require("./tenant-context");
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
function delegateName(model) {
    return model.charAt(0).toLowerCase() + model.slice(1);
}
const TENANT_REFERENCES = {
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
const TENANT_NESTED_MODELS = {
    Order: { items: 'OrderItem' },
};
function referenceIds(value) {
    if (typeof value === 'string')
        return [value];
    if (Array.isArray(value))
        return value.flatMap(referenceIds);
    if (typeof value !== 'object' || value === null)
        return [];
    if ('connect' in value)
        return referenceIds(value.connect);
    if ('set' in value)
        return referenceIds(value.set);
    if ('id' in value && typeof value.id === 'string')
        return [value.id];
    return [];
}
function nestedWrites(value) {
    if (Array.isArray(value))
        return value;
    if (typeof value !== 'object' || value === null)
        return [];
    const writes = [];
    if ('create' in value)
        writes.push(value.create);
    if ('createMany' in value && typeof value.createMany === 'object' && value.createMany !== null && 'data' in value.createMany) {
        writes.push(value.createMany.data);
    }
    if ('connectOrCreate' in value && typeof value.connectOrCreate === 'object' && value.connectOrCreate !== null && 'create' in value.connectOrCreate) {
        writes.push(value.connectOrCreate.create);
    }
    return writes;
}
function addNestedTenantData(value, model, companyId) {
    if (Array.isArray(value)) {
        return value.map((entry) => addTenantToData(entry, companyId, model));
    }
    if (typeof value !== 'object' || value === null)
        return value;
    const nested = value;
    const unsupportedOperations = Object.keys(nested).filter((operation) => !['create', 'createMany'].includes(operation));
    if (unsupportedOperations.length > 0) {
        throw new common_1.BadRequestException('This nested relationship operation is not supported for tenant-scoped records.');
    }
    const scoped = { ...nested };
    if ('create' in nested)
        scoped.create = addTenantToData(nested.create, companyId, model);
    if ('createMany' in nested && typeof nested.createMany === 'object' && nested.createMany !== null) {
        const createMany = nested.createMany;
        scoped.createMany = {
            ...createMany,
            data: addTenantToData(createMany.data, companyId, model),
        };
    }
    return scoped;
}
async function assertTenantRecord(client, model, id, companyId) {
    const delegate = Reflect.get(client, delegateName(model));
    const findFirst = Reflect.get(delegate, 'findFirst');
    if (typeof findFirst !== 'function') {
        throw new Error(`Prisma model ${model} does not support tenant reference checks.`);
    }
    const record = await Reflect.apply(findFirst, delegate, [{
            where: { id, companyId },
            select: { id: true },
        }]);
    if (!record) {
        throw new common_1.BadRequestException('A referenced record is not available in this business workspace.');
    }
}
async function validateTenantRelations(client, model, data, companyId) {
    const modelName = model.charAt(0).toUpperCase() + model.slice(1);
    const records = Array.isArray(data) ? data : [data];
    for (const record of records) {
        if (typeof record !== 'object' || record === null)
            continue;
        const values = record;
        const checks = [];
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
function addTenantToWhere(where, companyId) {
    return {
        ...(typeof where === 'object' && where !== null ? where : {}),
        companyId,
    };
}
function addTenantToData(data, companyId, model) {
    if (Array.isArray(data)) {
        return data.map((entry) => addTenantToData(entry, companyId, model));
    }
    if (typeof data === 'object' && data !== null) {
        const scoped = { ...data, companyId };
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
function wrapTenantClient(client, tenantContext) {
    return new Proxy(client, {
        get(target, property, receiver) {
            const value = Reflect.get(target, property, receiver);
            if (property === '$transaction' && typeof value === 'function') {
                return (input, ...options) => {
                    if (typeof input === 'function') {
                        return Reflect.apply(value, target, [
                            (transactionClient) => {
                                const scopedTransaction = wrapTenantClient(transactionClient, tenantContext);
                                return input(scopedTransaction);
                            },
                            ...options,
                        ]);
                    }
                    return Reflect.apply(value, target, [input, ...options]);
                };
            }
            if (typeof property !== 'string' || !TENANT_MODELS.has(property)) {
                return value;
            }
            return new Proxy(value, {
                get(delegate, operation, delegateReceiver) {
                    const method = Reflect.get(delegate, operation, delegateReceiver);
                    if (typeof operation !== 'string' || typeof method !== 'function') {
                        return method;
                    }
                    return async (...parameters) => {
                        const companyId = tenantContext.getCompanyId();
                        if (!companyId || !parameters[0] || typeof parameters[0] !== 'object') {
                            return await Reflect.apply(method, delegate, parameters);
                        }
                        const args = { ...parameters[0] };
                        if (['findUnique', 'findUniqueOrThrow', 'findFirst', 'findFirstOrThrow', 'findMany', 'count', 'aggregate', 'groupBy', 'update', 'updateMany', 'delete', 'deleteMany', 'upsert'].includes(operation)) {
                            args.where = addTenantToWhere(args.where, companyId);
                        }
                        if (operation === 'create' || operation === 'createMany' || operation === 'createManyAndReturn') {
                            args.data = addTenantToData(args.data, companyId, property);
                        }
                        else if (operation === 'upsert') {
                            args.create = addTenantToData(args.create, companyId, property);
                            if (typeof args.update === 'object' && args.update !== null) {
                                const update = { ...args.update };
                                delete update.companyId;
                                args.update = update;
                            }
                        }
                        else if (typeof args.data === 'object' && args.data !== null) {
                            const data = { ...args.data };
                            delete data.companyId;
                            args.data = data;
                        }
                        if (['create', 'createMany', 'createManyAndReturn', 'update', 'updateMany'].includes(operation)) {
                            await validateTenantRelations(target, property, args.data, companyId);
                        }
                        else if (operation === 'upsert') {
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
let PrismaService = class PrismaService extends client_1.PrismaClient {
    constructor(tenantContext) {
        super();
        return wrapTenantClient(this, tenantContext);
    }
    async onModuleInit() {
        await this.$connect();
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(tenant_context_1.TenantContext)),
    __metadata("design:paramtypes", [tenant_context_1.TenantContext])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map
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
exports.ProductService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_context_1 = require("../prisma/tenant-context");
const paginate_1 = require("../common/pagination/paginate");
const money_1 = require("../common/money");
let ProductService = class ProductService {
    constructor(prisma, tenantContext) {
        this.prisma = prisma;
        this.tenantContext = tenantContext;
    }
    async create(dto) {
        const companyId = this.tenantContext.getCompanyId();
        if (!companyId)
            throw new common_1.ForbiddenException('A business workspace is required.');
        const { price, compareAtPrice, ...productData } = dto;
        return this.prisma.product.create({
            data: {
                ...productData,
                priceMinor: (0, money_1.toMinorUnits)(price),
                compareAtPriceMinor: compareAtPrice == null ? null : (0, money_1.toMinorUnits)(compareAtPrice),
                companyId,
            },
        });
    }
    async findAll(query) {
        return (0, paginate_1.paginate)(query, (skip, take) => this.prisma.product.findMany({
            skip,
            take,
            include: { category: true },
        }), () => this.prisma.product.count());
    }
    async findOne(id) {
        const item = await this.prisma.product.findUnique({
            where: { id },
            include: { category: true }
        });
        if (!item)
            throw new common_1.NotFoundException(`Товар з ID ${id} не знайдено`);
        return item;
    }
    async update(id, dto) {
        await this.findOne(id);
        const { price, compareAtPrice, ...productData } = dto;
        return this.prisma.product.update({
            where: { id },
            data: {
                ...productData,
                ...(price === undefined ? {} : { priceMinor: (0, money_1.toMinorUnits)(price) }),
                ...(compareAtPrice === undefined
                    ? {}
                    : { compareAtPriceMinor: compareAtPrice === null ? null : (0, money_1.toMinorUnits)(compareAtPrice) }),
            },
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.product.delete({ where: { id } });
    }
};
exports.ProductService = ProductService;
exports.ProductService = ProductService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(prisma_service_1.PrismaService)),
    __param(1, (0, common_1.Inject)(tenant_context_1.TenantContext)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        tenant_context_1.TenantContext])
], ProductService);
//# sourceMappingURL=product.service.js.map
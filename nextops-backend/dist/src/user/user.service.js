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
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const paginate_1 = require("../common/pagination/paginate");
const tenant_context_1 = require("../prisma/tenant-context");
function withoutPassword(user) {
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return safeUser;
}
let UserService = class UserService {
    constructor(prisma, tenantContext) {
        this.prisma = prisma;
        this.tenantContext = tenantContext;
    }
    async create(dto) {
        const companyId = this.tenantContext.getCompanyId();
        if (!companyId)
            throw new common_1.ForbiddenException('A business workspace is required.');
        const user = await this.prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    ...dto,
                    role: 'MEMBER',
                    companyId,
                },
            });
            await tx.userAiBudget.create({
                data: {
                    userId: newUser.id,
                    companyId,
                    monthlyLimitMinor: 1000,
                    resetDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
                },
            });
            return newUser;
        });
        return withoutPassword(user);
    }
    async findAll(query) {
        const page = await (0, paginate_1.paginate)(query, (skip, take) => this.prisma.user.findMany({ skip, take }), () => this.prisma.user.count());
        return { ...page, data: page.data.map(withoutPassword) };
    }
    async findOne(id) {
        const item = await this.prisma.user.findUnique({ where: { id } });
        if (!item)
            throw new common_1.NotFoundException(`Користувача не знайдено`);
        return withoutPassword(item);
    }
    async update(id, dto) {
        const updatedUser = await this.prisma.user.update({
            where: { id },
            data: { ...dto, role: undefined, companyId: undefined, passwordHash: undefined },
        });
        return withoutPassword(updatedUser);
    }
    async remove(id) {
        const deletedUser = await this.prisma.user.delete({ where: { id } });
        return withoutPassword(deletedUser);
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(prisma_service_1.PrismaService)),
    __param(1, (0, common_1.Inject)(tenant_context_1.TenantContext)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        tenant_context_1.TenantContext])
], UserService);
//# sourceMappingURL=user.service.js.map
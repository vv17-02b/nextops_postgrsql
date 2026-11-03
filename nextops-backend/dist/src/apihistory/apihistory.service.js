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
exports.ApiHistoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const paginate_1 = require("../common/pagination/paginate");
let ApiHistoryService = class ApiHistoryService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, userId) {
        return this.prisma.apiHistory.create({
            data: {
                userId,
                endpoint: dto.endpoint,
                method: dto.method,
                statusCode: dto.statusCode,
                durationMs: dto.durationMs,
            },
        });
    }
    async findAll(query) {
        return (0, paginate_1.paginate)(query, (skip, take) => this.prisma.apiHistory.findMany({
            skip,
            take,
            orderBy: { createdAt: 'desc' },
        }), () => this.prisma.apiHistory.count());
    }
    async findOne(id) {
        const item = await this.prisma.apiHistory.findUnique({ where: { id } });
        if (!item)
            throw new common_1.NotFoundException(`Запис логу з ID ${id} не знайдено`);
        return item;
    }
    async update(id, dto) {
        void id;
        void dto;
        throw new common_1.MethodNotAllowedException('Оновлення записів ApiHistory заборонено політикою бази даних');
    }
    async remove(id) {
        void id;
        throw new common_1.MethodNotAllowedException('Видалення окремих записів ApiHistory заборонено політикою бази даних');
    }
};
exports.ApiHistoryService = ApiHistoryService;
exports.ApiHistoryService = ApiHistoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(prisma_service_1.PrismaService)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ApiHistoryService);
//# sourceMappingURL=apihistory.service.js.map
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
exports.UserAiBudgetController = void 0;
const common_1 = require("@nestjs/common");
const useraibudget_service_1 = require("./useraibudget.service");
const create_useraibudget_dto_1 = require("./dto/create-useraibudget.dto");
const update_useraibudget_dto_1 = require("./dto/update-useraibudget.dto");
const pagination_query_dto_1 = require("../common/pagination/pagination-query.dto");
const roles_decorator_1 = require("../auth/roles.decorator");
let UserAiBudgetController = class UserAiBudgetController {
    constructor(service) {
        this.service = service;
    }
    create(dto) {
        return this.service.create(dto);
    }
    findAll(query) {
        return this.service.findAll(query);
    }
    findOne(id) {
        return this.service.findOne(id);
    }
    update(id, dto) {
        return this.service.update(id, dto);
    }
    remove(id) {
        return this.service.remove(id);
    }
};
exports.UserAiBudgetController = UserAiBudgetController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_useraibudget_dto_1.CreateUserAiBudgetDto]),
    __metadata("design:returntype", Promise)
], UserAiBudgetController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_query_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", Promise)
], UserAiBudgetController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserAiBudgetController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_useraibudget_dto_1.UpdateUserAiBudgetDto]),
    __metadata("design:returntype", Promise)
], UserAiBudgetController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserAiBudgetController.prototype, "remove", null);
exports.UserAiBudgetController = UserAiBudgetController = __decorate([
    (0, common_1.Controller)('useraibudget'),
    (0, roles_decorator_1.Roles)('OWNER', 'ADMIN'),
    __param(0, (0, common_1.Inject)(useraibudget_service_1.UserAiBudgetService)),
    __metadata("design:paramtypes", [useraibudget_service_1.UserAiBudgetService])
], UserAiBudgetController);
//# sourceMappingURL=useraibudget.controller.js.map
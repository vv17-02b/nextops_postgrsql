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
exports.WebhookConfigController = void 0;
const common_1 = require("@nestjs/common");
const webhookconfig_service_1 = require("./webhookconfig.service");
const create_webhookconfig_dto_1 = require("./dto/create-webhookconfig.dto");
const update_webhookconfig_dto_1 = require("./dto/update-webhookconfig.dto");
const pagination_query_dto_1 = require("../common/pagination/pagination-query.dto");
const roles_decorator_1 = require("../auth/roles.decorator");
let WebhookConfigController = class WebhookConfigController {
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
exports.WebhookConfigController = WebhookConfigController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_webhookconfig_dto_1.CreateWebhookConfigDto]),
    __metadata("design:returntype", Promise)
], WebhookConfigController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_query_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", Promise)
], WebhookConfigController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WebhookConfigController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_webhookconfig_dto_1.UpdateWebhookConfigDto]),
    __metadata("design:returntype", Promise)
], WebhookConfigController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WebhookConfigController.prototype, "remove", null);
exports.WebhookConfigController = WebhookConfigController = __decorate([
    (0, common_1.Controller)('webhookconfig'),
    (0, roles_decorator_1.Roles)('OWNER', 'ADMIN'),
    __param(0, (0, common_1.Inject)(webhookconfig_service_1.WebhookConfigService)),
    __metadata("design:paramtypes", [webhookconfig_service_1.WebhookConfigService])
], WebhookConfigController);
//# sourceMappingURL=webhookconfig.controller.js.map
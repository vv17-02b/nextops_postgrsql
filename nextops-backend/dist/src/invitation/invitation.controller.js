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
exports.InvitationController = void 0;
const common_1 = require("@nestjs/common");
const public_decorator_1 = require("../auth/public.decorator");
const roles_decorator_1 = require("../auth/roles.decorator");
const accept_invitation_dto_1 = require("./dto/accept-invitation.dto");
const create_invitation_dto_1 = require("./dto/create-invitation.dto");
const invitation_service_1 = require("./invitation.service");
let InvitationController = class InvitationController {
    constructor(service) {
        this.service = service;
    }
    invite(dto, request) {
        return this.service.invite(dto, request.user.role);
    }
    accept(dto) {
        return this.service.accept(dto);
    }
};
exports.InvitationController = InvitationController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('OWNER', 'ADMIN'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_invitation_dto_1.CreateInvitationDto, Object]),
    __metadata("design:returntype", Promise)
], InvitationController.prototype, "invite", null);
__decorate([
    (0, common_1.Post)('accept'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [accept_invitation_dto_1.AcceptInvitationDto]),
    __metadata("design:returntype", Promise)
], InvitationController.prototype, "accept", null);
exports.InvitationController = InvitationController = __decorate([
    (0, common_1.Controller)('invitation'),
    __param(0, (0, common_1.Inject)(invitation_service_1.InvitationService)),
    __metadata("design:paramtypes", [invitation_service_1.InvitationService])
], InvitationController);
//# sourceMappingURL=invitation.controller.js.map
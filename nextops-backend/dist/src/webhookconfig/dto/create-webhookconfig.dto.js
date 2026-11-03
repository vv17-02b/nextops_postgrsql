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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateWebhookConfigDto = void 0;
const class_validator_1 = require("class-validator");
class CreateWebhookConfigDto {
}
exports.CreateWebhookConfigDto = CreateWebhookConfigDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Project ID є обовʼязковим для привʼязки вебхука' }),
    __metadata("design:type", String)
], CreateWebhookConfigDto.prototype, "projectId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'URL-адреса призначення є обовʼязковою' }),
    __metadata("design:type", String)
], CreateWebhookConfigDto.prototype, "url", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateWebhookConfigDto.prototype, "secret", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsNotEmpty)({ each: true, message: 'Кожна подія в масиві має бути текстовим рядком' }),
    __metadata("design:type", Array)
], CreateWebhookConfigDto.prototype, "events", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateWebhookConfigDto.prototype, "isActive", void 0);
//# sourceMappingURL=create-webhookconfig.dto.js.map
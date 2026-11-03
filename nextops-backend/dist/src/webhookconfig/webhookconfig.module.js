"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookConfigModule = void 0;
const common_1 = require("@nestjs/common");
const webhookconfig_service_1 = require("./webhookconfig.service");
const webhookconfig_controller_1 = require("./webhookconfig.controller");
let WebhookConfigModule = class WebhookConfigModule {
};
exports.WebhookConfigModule = WebhookConfigModule;
exports.WebhookConfigModule = WebhookConfigModule = __decorate([
    (0, common_1.Module)({
        controllers: [webhookconfig_controller_1.WebhookConfigController],
        providers: [webhookconfig_service_1.WebhookConfigService],
        exports: [webhookconfig_service_1.WebhookConfigService]
    })
], WebhookConfigModule);
//# sourceMappingURL=webhookconfig.module.js.map
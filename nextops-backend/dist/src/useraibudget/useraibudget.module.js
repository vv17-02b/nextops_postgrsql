"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserAiBudgetModule = void 0;
const common_1 = require("@nestjs/common");
const useraibudget_service_1 = require("./useraibudget.service");
const useraibudget_controller_1 = require("./useraibudget.controller");
let UserAiBudgetModule = class UserAiBudgetModule {
};
exports.UserAiBudgetModule = UserAiBudgetModule;
exports.UserAiBudgetModule = UserAiBudgetModule = __decorate([
    (0, common_1.Module)({
        controllers: [useraibudget_controller_1.UserAiBudgetController],
        providers: [useraibudget_service_1.UserAiBudgetService],
        exports: [useraibudget_service_1.UserAiBudgetService]
    })
], UserAiBudgetModule);
//# sourceMappingURL=useraibudget.module.js.map
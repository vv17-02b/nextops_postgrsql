"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantContext = void 0;
const node_async_hooks_1 = require("node:async_hooks");
const common_1 = require("@nestjs/common");
let TenantContext = class TenantContext {
    constructor() {
        this.storage = new node_async_hooks_1.AsyncLocalStorage();
    }
    use(_request, _response, next) {
        this.storage.run({ companyId: null }, next);
    }
    getCompanyId() {
        return this.storage.getStore()?.companyId ?? null;
    }
    setCompanyId(companyId) {
        const store = this.storage.getStore();
        if (store) {
            store.companyId = companyId;
        }
    }
};
exports.TenantContext = TenantContext;
exports.TenantContext = TenantContext = __decorate([
    (0, common_1.Injectable)()
], TenantContext);
//# sourceMappingURL=tenant-context.js.map
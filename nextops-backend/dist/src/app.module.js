"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const account_module_1 = require("./account/account.module");
const agentknowledgebase_module_1 = require("./agentknowledgebase/agentknowledgebase.module");
const apihistory_module_1 = require("./apihistory/apihistory.module");
const category_module_1 = require("./category/category.module");
const order_module_1 = require("./order/order.module");
const orderitem_module_1 = require("./orderitem/orderitem.module");
const product_module_1 = require("./product/product.module");
const project_module_1 = require("./project/project.module");
const review_module_1 = require("./review/review.module");
const session_module_1 = require("./session/session.module");
const user_module_1 = require("./user/user.module");
const useraibudget_module_1 = require("./useraibudget/useraibudget.module");
const verificationtoken_module_1 = require("./verificationtoken/verificationtoken.module");
const warehouse_module_1 = require("./warehouse/warehouse.module");
const webhookconfig_module_1 = require("./webhookconfig/webhookconfig.module");
const health_module_1 = require("./health/health.module");
const tenant_context_1 = require("./prisma/tenant-context");
const invitation_module_1 = require("./invitation/invitation.module");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(tenant_context_1.TenantContext).forRoutes('*splat');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            invitation_module_1.InvitationModule,
            auth_module_1.AuthModule,
            account_module_1.AccountModule,
            agentknowledgebase_module_1.AgentKnowledgeBaseModule,
            apihistory_module_1.ApiHistoryModule,
            category_module_1.CategoryModule,
            order_module_1.OrderModule,
            orderitem_module_1.OrderItemModule,
            product_module_1.ProductModule,
            project_module_1.ProjectModule,
            review_module_1.ReviewModule,
            session_module_1.SessionModule,
            user_module_1.UserModule,
            useraibudget_module_1.UserAiBudgetModule,
            verificationtoken_module_1.VerificationTokenModule,
            warehouse_module_1.WarehouseModule,
            webhookconfig_module_1.WebhookConfigModule,
            health_module_1.HealthModule
        ],
        providers: [],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map
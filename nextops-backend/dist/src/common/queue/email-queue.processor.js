"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailQueueProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const nodemailer_1 = require("nodemailer");
let EmailQueueProcessor = class EmailQueueProcessor extends bullmq_1.WorkerHost {
    async process(job) {
        const smtpUrl = process.env.SMTP_URL;
        const sender = process.env.EMAIL_FROM;
        if (!smtpUrl || !sender) {
            throw new common_1.ServiceUnavailableException('SMTP_URL and EMAIL_FROM are required to deliver email jobs.');
        }
        const transport = nodemailer_1.default.createTransport(smtpUrl);
        const isPasswordReset = job.data.companyName.startsWith('PASSWORD_RESET');
        await transport.sendMail({
            from: sender,
            to: job.data.email,
            subject: isPasswordReset
                ? 'Reset your NextOps password'
                : `Invitation to ${job.data.companyName}`,
            text: isPasswordReset
                ? `Use this link within 30 minutes to reset your password: ${job.data.invitationUrl}`
                : `You have been invited to join ${job.data.companyName}. Accept the invitation: ${job.data.invitationUrl}`,
        });
    }
};
exports.EmailQueueProcessor = EmailQueueProcessor;
exports.EmailQueueProcessor = EmailQueueProcessor = __decorate([
    (0, common_1.Injectable)(),
    (0, bullmq_1.Processor)('email')
], EmailQueueProcessor);
//# sourceMappingURL=email-queue.processor.js.map
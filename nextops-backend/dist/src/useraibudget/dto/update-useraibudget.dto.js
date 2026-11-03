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
exports.UpdateUserAiBudgetDto = void 0;
const class_validator_1 = require("class-validator");
class UpdateUserAiBudgetDto {
}
exports.UpdateUserAiBudgetDto = UpdateUserAiBudgetDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateUserAiBudgetDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsInt)({ message: 'Загальний бюджет (totalBudgetMinor) має бути цілим числом копійок' }),
    (0, class_validator_1.Min)(0, { message: 'Загальний бюджет не може бути відʼємним' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateUserAiBudgetDto.prototype, "totalBudgetMinor", void 0);
__decorate([
    (0, class_validator_1.IsInt)({ message: 'Використаний бюджет (usedBudgetMinor) має бути цілим числом копійок' }),
    (0, class_validator_1.Min)(0, { message: 'Використаний бюджет не може бути відʼємним' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateUserAiBudgetDto.prototype, "usedBudgetMinor", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateUserAiBudgetDto.prototype, "currency", void 0);
//# sourceMappingURL=update-useraibudget.dto.js.map
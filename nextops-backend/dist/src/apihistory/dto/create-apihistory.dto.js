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
exports.CreateApiHistoryDto = void 0;
const class_validator_1 = require("class-validator");
class CreateApiHistoryDto {
}
exports.CreateApiHistoryDto = CreateApiHistoryDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2048),
    (0, class_validator_1.IsNotEmpty)({ message: 'Ендпоінт (endpoint) є обовʼязковим для логування' }),
    __metadata("design:type", String)
], CreateApiHistoryDto.prototype, "endpoint", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(16),
    (0, class_validator_1.IsNotEmpty)({ message: 'Метод запиту (method) є обовʼязковим' }),
    __metadata("design:type", String)
], CreateApiHistoryDto.prototype, "method", void 0);
__decorate([
    (0, class_validator_1.IsInt)({ message: 'Статус-код має бути цілим числом' }),
    (0, class_validator_1.Min)(100),
    (0, class_validator_1.Max)(599),
    __metadata("design:type", Number)
], CreateApiHistoryDto.prototype, "statusCode", void 0);
__decorate([
    (0, class_validator_1.IsInt)({ message: 'Тривалість запиту (durationMs) має бути цілим числом' }),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateApiHistoryDto.prototype, "durationMs", void 0);
//# sourceMappingURL=create-apihistory.dto.js.map
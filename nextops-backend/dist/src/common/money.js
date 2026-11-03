"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_MINOR_UNITS = void 0;
exports.toMinorUnits = toMinorUnits;
const common_1 = require("@nestjs/common");
exports.MAX_MINOR_UNITS = 2_147_483_647;
function toMinorUnits(amount) {
    const minorUnits = Math.round(amount * 100);
    if (!Number.isFinite(amount)
        || !Number.isSafeInteger(minorUnits)
        || minorUnits > exports.MAX_MINOR_UNITS
        || amount < 0
        || Math.abs(amount * 100 - minorUnits) > 1e-7) {
        throw new common_1.BadRequestException('Money amounts must be non-negative and have at most two decimal places.');
    }
    return minorUnits;
}
//# sourceMappingURL=money.js.map
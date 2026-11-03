"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginate = paginate;
const common_1 = require("@nestjs/common");
async function paginate(query, findPage, count) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
        throw new common_1.BadRequestException({
            message: 'Pagination parameters are invalid.',
            errorCode: 'INVALID_PAGINATION',
            errors: [],
        });
    }
    const [data, total] = await Promise.all([
        findPage((page - 1) * limit, limit),
        count(),
    ]);
    return {
        data,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}
//# sourceMappingURL=paginate.js.map
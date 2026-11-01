"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.responseFormatter = void 0;
const responseFormatter = (handler) => {
    return async (req, res, next) => {
        const { message = true, data = undefined, status = 200, extra = undefined } = await handler(req, res, next);
        if (res.headersSent)
            return;
        return res.status(status).json({ message, data, extra, status });
    };
};
exports.responseFormatter = responseFormatter;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationExciption = void 0;
class ApplicationExciption extends Error {
    message;
    status;
    cause;
    constructor(message, status, cause) {
        super();
        this.message = message;
        this.status = status;
        this.cause = cause;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ApplicationExciption = ApplicationExciption;

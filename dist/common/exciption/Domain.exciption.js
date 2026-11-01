"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TooManyRequestExciption = exports.ConfilectRrquestExciption = exports.ForbiddenExciption = exports.UnauthorizedExciption = exports.NotFoundExciption = exports.BadRequestExciption = void 0;
const Application_exciption_1 = require("./Application.exciption");
class BadRequestExciption extends Application_exciption_1.ApplicationExciption {
    constructor(message = "BadRequest", cause) {
        super(message, 400, cause);
    }
}
exports.BadRequestExciption = BadRequestExciption;
class NotFoundExciption extends Application_exciption_1.ApplicationExciption {
    constructor(message = "NotFound", cause) {
        super(message, 404, cause);
    }
}
exports.NotFoundExciption = NotFoundExciption;
class UnauthorizedExciption extends Application_exciption_1.ApplicationExciption {
    constructor(message = "Unauthorized", cause) {
        super(message, 401, cause);
    }
}
exports.UnauthorizedExciption = UnauthorizedExciption;
class ForbiddenExciption extends Application_exciption_1.ApplicationExciption {
    constructor(message = "Forbidden", cause) {
        super(message, 403, cause);
    }
}
exports.ForbiddenExciption = ForbiddenExciption;
class ConfilectRrquestExciption extends Application_exciption_1.ApplicationExciption {
    constructor(message = "Confilect", cause) {
        super(message, 409, cause);
    }
}
exports.ConfilectRrquestExciption = ConfilectRrquestExciption;
class TooManyRequestExciption extends Application_exciption_1.ApplicationExciption {
    constructor(message = "TooManyRequest", cause) {
        super(message, 429, cause);
    }
}
exports.TooManyRequestExciption = TooManyRequestExciption;

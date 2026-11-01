import { ApplicationExciption } from "./Application.exciption"





export class BadRequestExciption extends ApplicationExciption {
    constructor(message: string = "BadRequest", cause?: unknown) {
        super(message, 400, cause)

    }
}


export class NotFoundExciption extends ApplicationExciption {
    constructor(message: string = "NotFound", cause?: unknown) {
        super(message, 404, cause)

    }
} 



export class UnauthorizedExciption extends ApplicationExciption {
    constructor(message: string = "Unauthorized", cause?: unknown) {
        super(message, 401, cause)

    }
} 


export class ForbiddenExciption extends ApplicationExciption {
    constructor(message: string = "Forbidden", cause?: unknown) {
        super(message, 403, cause)

    }
} 


export class ConfilectRrquestExciption extends ApplicationExciption {
    constructor(message: string = "Confilect", cause?: unknown) {
        super(message, 409, cause)

    }
}
export class TooManyRequestExciption extends ApplicationExciption {
    constructor(message: string = "TooManyRequest", cause?: unknown) {
        super(message, 429, cause )

    }
}  
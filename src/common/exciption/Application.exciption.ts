

export class ApplicationExciption extends Error {
    constructor(override message: string, public status: number, override cause?: unknown) {
        super()   // shorthand
        this.name = this.constructor.name // هنا بيظهر ان نوع ال erorr كذا من الي انا حططهم
        Error.captureStackTrace(this, this.constructor) // دي بتظهر مكان الي فيه error وتجيبه
    }

}



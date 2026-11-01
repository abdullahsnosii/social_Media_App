"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseRepsoitory = void 0;
class DatabaseRepsoitory {
    model;
    constructor(model) {
        this.model = model;
    }
    async create({ data, options }) {
        return await this.model.create(data);
    }
}
exports.DatabaseRepsoitory = DatabaseRepsoitory;

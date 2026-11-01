"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FollowRepository = void 0;
const bace_repository_js_1 = require("./bace.repository.js");
const follow_model_js_1 = require("../../DB/model/follow.model.js");
class FollowRepository extends bace_repository_js_1.DatabaseRepository {
    constructor() {
        super(follow_model_js_1.FollowModel);
    }
    async aggregate({ pipeline }) {
        return await this.model.aggregate(pipeline);
    }
}
exports.FollowRepository = FollowRepository;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.friendRequestRepository = exports.FriendRequestRepository = void 0;
const model_1 = require("../../DB/model");
const bace_repository_js_1 = require("./bace.repository.js");
class FriendRequestRepository extends bace_repository_js_1.DatabaseRepository {
    constructor() {
        super(model_1.FriendRequestModel);
    }
}
exports.FriendRequestRepository = FriendRequestRepository;
exports.friendRequestRepository = new FriendRequestRepository();

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postRepository = exports.PostRepository = void 0;
const model_1 = require("../../DB/model");
const bace_repository_js_1 = require("./bace.repository.js");
class PostRepository extends bace_repository_js_1.DatabaseRepository {
    constructor() {
        super(model_1.PostModel);
    }
}
exports.PostRepository = PostRepository;
exports.postRepository = new PostRepository();

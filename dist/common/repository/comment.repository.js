"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentRepository = exports.CommentRepository = void 0;
const model_1 = require("../../DB/model");
const bace_repository_js_1 = require("./bace.repository.js");
class CommentRepository extends bace_repository_js_1.DatabaseRepository {
    constructor() {
        super(model_1.CommentModel);
    }
}
exports.CommentRepository = CommentRepository;
exports.commentRepository = new CommentRepository();

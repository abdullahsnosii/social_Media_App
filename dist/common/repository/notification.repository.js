"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRepository = exports.NotificationRepository = void 0;
const notification_model_1 = require("../../DB/model/notification.model");
const bace_repository_js_1 = require("./bace.repository.js");
class NotificationRepository extends bace_repository_js_1.DatabaseRepository {
    constructor() {
        super(notification_model_1.NotificationModel);
    }
}
exports.NotificationRepository = NotificationRepository;
exports.notificationRepository = new NotificationRepository();

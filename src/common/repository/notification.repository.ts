
import { INotification } from "../interface/notification.interface";
import { NotificationModel } from "../../DB/model/notification.model";
import { DatabaseRepository } from "./bace.repository.js";


export  class NotificationRepository extends DatabaseRepository<INotification> {
  constructor(){
    super(NotificationModel)
  }

  
}

export const notificationRepository = new NotificationRepository();

import { CommentModel} from "../../DB/model";
import { IComment } from "../interface";
import { DatabaseRepository } from "./bace.repository.js";


export  class CommentRepository extends DatabaseRepository<IComment> {
  constructor(){
    super(CommentModel)
  }

  
}

export const commentRepository = new CommentRepository();
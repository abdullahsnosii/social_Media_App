import { PostModel } from "../../DB/model";
import { IPost } from "../interface";
import { DatabaseRepository } from "./bace.repository.js";




export  class PostRepository extends DatabaseRepository<IPost> {
  constructor(){
    super(PostModel)
  }

  
}

export const postRepository = new PostRepository();
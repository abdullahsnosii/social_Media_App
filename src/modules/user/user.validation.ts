import { z } from "zod";
import type { LanguageEnum } from "../../common/enum/index.js";
import { generalValidationFields } from "../../common/utils/index.js";

export const userIdParam = (lang: LanguageEnum) => z.object({
    params: z.strictObject({ id: generalValidationFields.id(lang) })
})

export const search = (lang: LanguageEnum) => z.object({
    query: z.strictObject({
        q: z.string().trim().min(1).max(50),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(50).default(10)
    })
})

export const suggestions = (lang: LanguageEnum) => z.object({
    query: z.strictObject({
        limit: z.coerce.number().int().min(1).max(50).default(10)
    })
})

export const updatePrivacy = (lang: LanguageEnum) => z.object({
    body: z.strictObject({ isPrivate: z.boolean() })
})

    

export const sendFriendRequest = (lang:LanguageEnum)=>{
     return z.object({
    body:z.strictObject({
        receiverId:generalValidationFields.id(lang),
        note:z.string().optional()
    }),
})
}


export const acceptFriendRequest = (lang:LanguageEnum)=>{
     return z.object({
    params:z.strictObject({
        friendRequestId:generalValidationFields.id(lang)
    }),
})
}


export const unFriend = (lang:LanguageEnum)=>{
     return z.object({
    params:z.strictObject({
        friendId:generalValidationFields.id(lang)
    }),
})
}
export const followUser = (lang:LanguageEnum)=>{
     return z.object({
    params:z.strictObject({
        userId: generalValidationFields.id(lang) 
    })

})
}  

export const updatePrivacySchema = (lang:LanguageEnum)=>{
     return z.object({
    body:z.strictObject({
        isPrivate:generalValidationFields.isPrivate(lang)
    }),
})
}


export const blockFriend = (lang:LanguageEnum)=>{
     return z.object({
    params:z.strictObject({
        friendId:generalValidationFields.id(lang)
    }),
})
}
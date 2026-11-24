import mongoose, { type HydratedDocument } from "mongoose";
import { AccountStatusEnum, GenderEnum, ProviderEnum, RoleEnum } from "../../common/enum/index.js";
import type { IUser } from "../../common/interface/user.interface.js";

import { encryption } from "../../common/security/encryption.security.js";
import { hash } from "../../common/security/hash.security.js";
import { string } from "zod";
import { log } from "console";

const userSchema = new mongoose.Schema<IUser>(
    {

        firstName: {
            type: String,
            minLength: 2,
            maxLength: 25,
            required: true
        },
        lastName: {
            type: String,
            minLength: 2,
            maxLength: 25,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: function (): boolean {
                return this.provider == ProviderEnum.SYSTEM
            }
        },

        phone: String,
        DOB: Date,
        confirmEmail: Date,
        image: String,
        coverImage: [String],
        gender: {
            type: Number,
            enum: GenderEnum,
            default: GenderEnum.MALE
        },
        role: {
            type: Number,
            enum: RoleEnum,
            default: RoleEnum.USER
        },
        provider: {
            type: Number,
            enum: ProviderEnum,
            default: ProviderEnum.SYSTEM
        },
        isPrivate: { type: Boolean, default: false },

        changeCredentialsTime: Date,
        twoStepVerification: Date,
        status: { type: Number, enum: AccountStatusEnum, default: AccountStatusEnum.ACTIVE },
        ChangeStatusAt: Date,


    },
    {
        timestamps: true,
        toObject: { virtuals: true },
        toJSON: { virtuals: true },
        autoIndex: true,
        strict: true,
        strictQuery: true

    }
)

userSchema.virtual("username").set(function (value) {
    const [firstName, lastName] = value?.split(" ") || [];
    this.set({ firstName, lastName })
}).get(function () {
    return `${this.firstName} ${this.lastName}`
})

// userSchema.pre('validate', function () {
//     console.log("pre_validate")
//     // console.log(this);

//     if (this.provider == ProviderEnum.GOOGLE && this.password) {
//         throw new Error("Google Account cannot hold password");

//     }
// })

// userSchema.post('validate', function (doc) {
//     console.log("post_validate")


// })



// userSchema.pre('save', async function () {
//     console.log({extraName:this.isDirectModified("extra.name")})
//     console.log({extra:this.isDirectModified("extra")})
//     // console.log(this.isModified("password"));  // ismodified بئسله لو معملوله مطلوب 
//     //console.log(this.modifiedPaths());   // دي تكمله الي فوق بمعني لو الي فوق اه اعمل path
//     if (this.isModified("password")) {
//         this.password = await hash(this.password)
//     }
//     if (this.isModified("phone")) {
//         this.phone = await encryption(this.phone as string)
//     }
// }
// )


// userSchema.post("save", async function (doc) {
//     // console.log(doc);

// }

// )


// SOFT DELETE
userSchema.pre(["findOne","find"] , async function () {
    // console.log(this.getFilter())
    // console.log(this.getQuery())
    const query = this.getFilter()
    if (query.paranoid != false) {
        this.setQuery({ ...query, status: { $ne: AccountStatusEnum.ARCHIVE } })
    }
    console.log({post:this.getFilter()});
    
})


export const UserModel = mongoose.models.User || mongoose.model<IUser>("User", userSchema)
export type HUser = HydratedDocument<IUser>
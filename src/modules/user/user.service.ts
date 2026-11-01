import jwt from 'jsonwebtoken'
import { decryption } from '../../common/security/encryption.security.js'
import { UserRepository } from '../../common/repository/user.repository.js'
import { cacheService, type CacheService } from '../../common/service/cache.service.js'
import { tokenSecurity, type TokenSecurity } from '../../common/security/token.security.js'
import { ACCESS_TOKEN_EXPIRES_IN } from '../../config.js'
import { ConfilectRrquestExciption } from '../../common/exciption/Domain.exciption.js'
import { LogoutEnum } from '../../common/enum/security.enum.js'
import type { HydratedDocument } from 'mongoose'
import type { IUser } from '../../common/interface/user.interface.js'
import type mongoose from 'mongoose'



export class UserService {
    private userRepository: UserRepository
    private cacheService: CacheService
    private tokenSecurity: TokenSecurity
    constructor() {
        this.cacheService = cacheService
        this.tokenSecurity = tokenSecurity
        this.userRepository = new UserRepository()

    }


async profile  (user:HydratedDocument<IUser>){
const {password , ...safeUser} = user.toObject()
if(user.phone) safeUser.phone = await decryption(user.phone as string)
return {user:safeUser}
}

 async update  (user: HydratedDocument<IUser>, data: Partial<IUser>){
const allowed = ["firstName" , "lastName" , "DOB" , "gender"]
const safeData = Object.fromEntries(Object.entries(data).filter(([key]) => allowed.includes(key)))

const account = this.userRepository.findbyIdAndUpdate({
  
     id:user._id
      , update:safeData
    })
    
return account
  }
async  rotateToken  (payload: jwt.JwtPayload, user: HydratedDocument<IUser>, issuer: string){
const accessExpiresIn = (payload.iat! + ACCESS_TOKEN_EXPIRES_IN) * 1000
const currentTime = Date.now() + (5 * 6000)

if(currentTime < accessExpiresIn )
{
 throw new ConfilectRrquestExciption("sorry we cannot create new login credintials while current access token still within valid time range")
}

const data = await this.tokenSecurity.createLoginCredentials({user , issuer})
await this.tokenSecurity.createRevokeToken({payload})
return data
}



 async logout (payload: jwt.JwtPayload, user: HydratedDocument<IUser>, { action = LogoutEnum.DEVICE }: { action?: LogoutEnum } = {}){
  console.log({user});
  
  switch (action) {
    case LogoutEnum.ALL:
      user.changeCredentialsTime = new Date()
      await user.save()
      console.log({ kk:await this.cacheService.keys({prefix: await this.tokenSecurity.userBaseRevokeTokenKey({userId:payload.sub as string})})});
      
      await this.cacheService.del({key: await this.cacheService.keys({prefix: await this.tokenSecurity.userBaseRevokeTokenKey({userId:payload.sub as string})})})
      break;
  
    default:
      await this.tokenSecurity.createRevokeToken({payload})
      break;
  }
  return
}

}

export default new UserService()
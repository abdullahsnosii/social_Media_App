import jwt, { verify, type JwtPayload, type Secret, type SignOptions } from "jsonwebtoken";
import { ACCESS_ADMIN_TOKEN_SIGNUTURE, ACCESS_TOKEN_EXPIRES_IN, ACCESS_USER_TOKEN_SIGNUTURE, REFRESH_ADMIN_TOKEN_SIGNUTURE, REFRESH_TOKEN_EXPIRES_IN, REFRESH_USER_TOKEN_SIGNUTURE } from "../../config.js";
import { tokenTypeEnum } from "../enum/security.enum.js";
import { RoleEnum } from "../enum/user.enum.js";
import { compare } from "./hash.security.js";
import { randomUUID } from 'node:crypto'
import mongoose from "mongoose";
import type { HydratedDocument } from "mongoose";
import type { IUser } from "../interface/user.interface.js";
import { BadRequestExciption, NotFoundExciption, UnauthorizedExciption } from "../exciption/Domain.exciption.js";
import { UserRepository } from "../repository/user.repository.js";
import { cacheService, type CacheService } from "../service/cache.service.js";
import { ToObjectId } from "../utils/objectId.js";
import type { HUser } from "../../DB/model/user.model.js";

export type UserIdType = mongoose.Types.ObjectId | string
export type JwtPayloadType = JwtPayload & {
  sub: string,
  aud: number[],
  jti: string,
  iat: number

}
export class TokenSecurity {
  private readonly userRepository: UserRepository
  private readonly cacheService: CacheService
  constructor() {
    this.cacheService = cacheService
    this.userRepository = new UserRepository()

  }


  async userBaseKey({ userId }: { userId: UserIdType }): Promise<string> {
    return `User::${userId.toString()}`
  }



  async userBaseRevokeTokenKey({ userId }: { userId: UserIdType }): Promise<string> {
    return `${this.userBaseKey({ userId })}::Revoke_Token`
  }


  async userRevokeTokenKey({ userId, jti }: { userId: UserIdType, jti: string }): Promise<string> {
    return `${this.userBaseRevokeTokenKey({ userId })}::${jti}`
  }
  async createToken({
    payload = {},
    secret_key = ACCESS_ADMIN_TOKEN_SIGNUTURE,
    options = {}
  }: {
    payload?: string | Buffer | object
    secret_key?: Secret
    options?: SignOptions
  }): Promise<string> {
    return jwt.sign(payload, secret_key, options)
  }

  async verifyToken({
    token = "",
    secret_key = ACCESS_USER_TOKEN_SIGNUTURE,
  }: {
    token?: string,
    secret_key?: Secret
  }): Promise<JwtPayloadType> {
    return verify(token, secret_key) as JwtPayloadType
  }


  async getTokenSignatures({ role = RoleEnum.USER }: { role?: RoleEnum } = {}): Promise<{ accessSignature: Secret, refreshSignature: Secret }> {
    let signatures: { accessSignature: Secret, refreshSignature: Secret };
    switch (role) {
      case RoleEnum.ADMIN:
        signatures = { accessSignature: ACCESS_ADMIN_TOKEN_SIGNUTURE, refreshSignature: REFRESH_ADMIN_TOKEN_SIGNUTURE }
        break;
      default:
        signatures = { accessSignature: ACCESS_USER_TOKEN_SIGNUTURE, refreshSignature: REFRESH_USER_TOKEN_SIGNUTURE }
        break;
    }
    return signatures
  }

  async getSignature({ tokenType = tokenTypeEnum.ACCESS, role = RoleEnum.USER
  }: { tokenType?: tokenTypeEnum, role?: RoleEnum } = {}): Promise<Secret> {
    const signatures = await this.getTokenSignatures({ role })
    return tokenType == tokenTypeEnum.ACCESS ? signatures.accessSignature : signatures.refreshSignature
  }


  async decodeToken({
    authorization = "",
    tokenType = tokenTypeEnum.ACCESS
  }: {
    authorization?: string,
    tokenType?: tokenTypeEnum
  }): Promise<{ user: HUser, payload: JwtPayloadType }> {
    const decoded = jwt.decode(authorization) as JwtPayloadType
    // console.log(decoded);
    if (!decoded?.aud?.length) throw new BadRequestExciption("missing decoded payload")

    const payload = await this.verifyToken({
      token: authorization,
      secret_key: await this.getSignature({ tokenType, role: Number(decoded.aud[0]) as RoleEnum })
    })

    if (!payload?.sub) throw new BadRequestExciption("missing token payload")

    if (await this.cacheService.exist({ key: await this.userRevokeTokenKey({ userId: payload.sub as UserIdType, jti: payload.jti as string }) })) {
      throw new UnauthorizedExciption("Expired login credentials")
    }

    const user = await this.userRepository.findbyId({
      id: ToObjectId(payload.sub)
    })

    if (!user) throw new NotFoundExciption("Invalid user")

    // console.log({change:user.changeCredentialsTime?.getTime() , iat:payload.iat!*1000} );
    if ((user.changeCredentialsTime?.getTime() ?? 0) > payload.iat * 1000) {
      throw new UnauthorizedExciption("Expired login credentials")
    }
    return { user, payload }

  }






  async createLoginCredentials({
    user,
    issuer,
    options = {}
  }: {
    user: HUser,
    issuer?: string,
    options?: SignOptions
  }): Promise<{ access_token: string, refresh_token: string }> {

    const { accessSignature, refreshSignature } = await this.getTokenSignatures({ role: user.role })
    const jwtid = randomUUID()
    const access_token = await this.createToken({
      payload: { sub: user._id },
      secret_key: accessSignature,
      options: {
        ...options,
        issuer,
        audience: [String(user.role)],
        expiresIn: ACCESS_TOKEN_EXPIRES_IN,
        jwtid
      }
    })

    const refresh_token = await this.createToken({
      payload: { sub: user._id },
      secret_key: refreshSignature,
      options: {
        ...options,
        issuer,
        audience: [String(user.role)],
        expiresIn: REFRESH_TOKEN_EXPIRES_IN,
        jwtid
      },

    })
    console.log({ accessSignature, refreshSignature });

    return { access_token, refresh_token }
  }


  async createRevokeToken({ payload }: { payload: JwtPayloadType }): Promise<void> {
    const consumedTime = (Math.ceil(Date.now() / 1000) - payload.iat!)
    const refreshExpiredIn = payload.iat! + REFRESH_TOKEN_EXPIRES_IN
    const ttl = refreshExpiredIn - consumedTime
    console.log({ payload, consumedTime, refreshExpiredIn, ttl });
    await this.cacheService.set({ key: await this.userRevokeTokenKey({ userId: payload.sub , jti: payload.jti  }), value: payload.jti, ttl })
    return;
  }



  async basicAuth({ email, password }: { email: string, password: string }): Promise<HUser> {
    const account = await this.userRepository.findOne({
      filter: { email }
    })
    if (!account) throw new NotFoundExciption("not Exist")
    const match = await compare(password, account.password)

    if (!match) throw new NotFoundExciption("not Exist")
    return await account

  }
}

export const tokenSecurity = new TokenSecurity()
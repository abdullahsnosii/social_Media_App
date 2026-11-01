import type { Response } from "express";

export interface IResponse<Z = any, T = any> {
    message?: boolean;
    data?: T;
    extra?: Z;
    status?: number
} 
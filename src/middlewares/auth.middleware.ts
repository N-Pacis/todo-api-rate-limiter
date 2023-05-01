import { verifyToken } from './../utils/jwt.utils';
import { NextFunction, Response } from "express";
import { Request } from "express";
import { errorResponse } from '../utils/api.response';
import { CustomRequest } from '../types/data';

 
export default function (req: Request, res: Response, next:NextFunction) {
    if (!req.header("Authorization"))
    return errorResponse("Access Denied! You need to login first", res);

  const token: string|undefined = req.header("Authorization")?.trim()?.replace('Bearer ', '');

  if (!token)
    return errorResponse("Access Denied! You need to login first", res);
  try {
    
    const decoded = verifyToken(token);
    (req as unknown as CustomRequest).user = decoded;
 
    next();
  } catch (ex) {
    return errorResponse("Invalid token", res);
  }
}

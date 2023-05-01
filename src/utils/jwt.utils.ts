import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(__dirname, '../../../.env') });
import jwt from 'jsonwebtoken';

const secret: string = process.env.JWT_KEY || '';

export const signToken = (payload: any) => {
  return jwt.sign(payload, secret);
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, secret);
};

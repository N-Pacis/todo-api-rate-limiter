import { errorResponse, serverErrorResponse, successResponse } from './../utils/api.response';
import { Request, Response } from 'express';
import { compare, genSalt, hash } from 'bcrypt';
import { User } from '../types/user';
import UserModel from '../models/user.model';
import { signToken } from '../utils/jwt.utils';

export const registerUser = async (req: Request, res: Response) => {
  try {
    let { names, email, password } = req.body;

    let findUserByEmail: User | null = await User.findOne({ where: { email } });
    if (findUserByEmail)
      return errorResponse('User with the provided email already exists', res);

    const salt: string = await genSalt(10);
    password = await hash(password, salt);

    const user = await UserModel.create({
      email,
      names,
      password
    });
    return successResponse(
      'User created successfully. You can now login',
      {},
      res
    );
  } catch (error) {
    return serverErrorResponse(error, res);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    let { email, password } = req.body;

    if (!email || !password)
      return errorResponse('All fields are required!', res);

    let user: User | null = await User.findOne({ where: { email } });
    if (!user)
      return errorResponse('Invalid Email or Password', res);

    const validPassword: boolean = await compare(
      password,
      user.password
    );
    if (!validPassword) return errorResponse('Invalid Email or Password!', res);

    const token = signToken({ id: user.id });
    
    let responseObj = {
      token: token,
    };

    return successResponse("Login Successfully", responseObj, res);
  } catch (error) {
    return serverErrorResponse(error, res);
  }
};

export const getUserProfile = async (req: any, res: Response) => {
  try {
    const { id } = req.user;
    const user = await User.findByPk(id,{
      include: [
        {
          model: UserModel,
          as: 'user',
          attributes: ['names', 'email'],
        },
      ],
    });

    return successResponse('User profile', user, res);
  } catch (error) {
    return serverErrorResponse(error, res);
  }
};
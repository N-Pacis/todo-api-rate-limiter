import auth from '../middlewares/auth.middleware';
import { monthlyRateLimiterByUser } from '../utils/redis.utils';
import { registerUser, login, getUserProfile } from './../controllers/user.controller';
import { Router } from "express";

const userRouter = Router();

userRouter.post("/register",registerUser)
userRouter.post("/login",login)
userRouter.get("/profile",auth,monthlyRateLimiterByUser, getUserProfile)

export default userRouter;
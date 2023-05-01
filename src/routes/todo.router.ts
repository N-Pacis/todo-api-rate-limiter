import { monthlyRateLimiterByUser } from '../utils/redis.utils';
import { createTodo, getMyTodos } from './../controllers/todo.controller';
import { Router } from "express";

const todoRouter = Router();

todoRouter.post("/new",monthlyRateLimiterByUser,createTodo)
todoRouter.get("/all",monthlyRateLimiterByUser,getMyTodos)

export default todoRouter;
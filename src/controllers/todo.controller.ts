import {
  serverErrorResponse,
  successResponse,
} from '../utils/api.response';
import { Request, Response } from 'express';
import { Todo } from '../types/todo';
import TodoModel from '../models/todo.model';

export const createTodo = async (req: any, res: Response) => {
  try {
    let data: Todo = req.body as Todo;
    data.created_by = req.user.id;

    const newTodo = await TodoModel.create(data);
    return successResponse('Todo created', newTodo, res);
  } catch (ex) {
    return serverErrorResponse(ex, res);
  }
};

export const getMyTodos = async (req: any, res: Response) => {
  try {
    let todos = await TodoModel.findAll({
      where: {created_by: req.user.id },
    });

    return successResponse('Todos', todos, res);
  } catch (ex) {
    return serverErrorResponse(ex, res);
  }
};

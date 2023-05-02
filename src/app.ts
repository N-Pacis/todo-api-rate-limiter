import express, {Request, Response } from 'express';
import cors from 'cors';
import { corsFunction } from './utils/cors.utils';
import todoRouter from './routes/todo.router';
import userRouter from './routes/user.router';
import { globalAppRateLimiter, rateLimiterByIp } from './utils/redis.utils';
import auth from './middlewares/auth.middleware';
import swaggerUi from 'swagger-ui-express';
const swaggerJson = require('./utils/swagger.json');

const app = express();
const router = express.Router();

app.use(cors())

app
  .use(rateLimiterByIp)
  .use(globalAppRateLimiter)
  .use(corsFunction)
  .use(express.json())
  .use(express.urlencoded({ extended: true }))
  .use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerJson))
  .use("/users",userRouter)
  .use("/todos",auth,todoRouter)
  .use('/health', (_req: Request, res: Response) => {
    res.status(200).send({server: "Todo Api Rate Limiter Backend", time: new Date(),  status: "active"});
  })
  .use('*', (req, res) => {
    res.status(200).send('Route not found');
  });

export default app;
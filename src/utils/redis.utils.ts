import { NextFunction, Request, Response } from "express";
import moment from "moment";
import { createClient } from "redis";
import { invalidTraffic } from "./api.response";

if (process.env.ENV == "DEV") {
  const url = process.env.REDIS_DEV_URL;
  var redisClient = createClient({
    url,
  });
} else {
  const port: number = Number(process.env.REDIS_PROD_PORT);

  var redisClient = createClient({
    password: process.env.REDIS_PROD_PASSWORD,
    socket: {
      host: process.env.REDIS_PROD_HOST,
      port: port,
    },
  });
}

export const rateLimiterByIP = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const WINDOW_SIZE_IN_MINUTES = 1;
  const MAX_WINDOW_REQUEST_COUNT = 3;
  const WINDOW_LOG_INTERVAL_IN_SECONDS = 10;
  if (!redisClient.isOpen) await redisClient.connect();

  const record = await redisClient.get(req.ip);
  const currentRequestTime = moment();
  const data = record
    ? JSON.parse(record)
    : [{ requestTimeStamp: currentRequestTime.unix(), requestCount: 0 }];
  const windowStartTimestamp = moment()
    .subtract(WINDOW_SIZE_IN_MINUTES, "minutes")
    .unix();
  const requestsWithinWindow = data.filter(
    (entry: any) => entry.requestTimeStamp > windowStartTimestamp
  );
  const totalWindowRequestsCount = requestsWithinWindow.reduce(
    (accumulator: any, entry: any) => accumulator + entry.requestCount,
    0
  );

  if (totalWindowRequestsCount >= MAX_WINDOW_REQUEST_COUNT) {
    invalidTraffic(
      `You have exceeded the ${MAX_WINDOW_REQUEST_COUNT} requests in ${WINDOW_SIZE_IN_MINUTES} minute limit!`,
      res
    );
    return;
  }

  const lastRequestLog = data[data.length - 1];
  const potentialCurrentWindowIntervalStartTimeStamp = currentRequestTime
    .subtract(WINDOW_LOG_INTERVAL_IN_SECONDS, "seconds")
    .unix();

  if (
    lastRequestLog.requestTimeStamp >
    potentialCurrentWindowIntervalStartTimeStamp
  ) {
    lastRequestLog.requestCount++;
    data[data.length - 1] = lastRequestLog;
  } else {
    data.push({ requestTimeStamp: currentRequestTime.unix(), requestCount: 1 });
  }

  await redisClient.set(req.ip, JSON.stringify(data));
  next();
};

export const monthlyRateLimiterByUser = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  if (req.user == undefined) {
    next();
    return;
  }
  const WINDOW_SIZE_IN_MONTHS = 1;
  const MAX_MONTHLY_REQUEST_COUNT = 20;
  if (!redisClient.isOpen) await redisClient.connect();

  const userId = req.user?.id;
  const record = await redisClient.get(`user:${userId}`);
  const currentMonth = moment().startOf("month");
  const data = record
    ? JSON.parse(record)
    : [{ month: currentMonth.unix(), requestCount: 0 }];
  const windowStartTimestamp = moment()
    .subtract(WINDOW_SIZE_IN_MONTHS, "months")
    .startOf("month")
    .unix();
  const requestsWithinWindow = data.filter(
    (entry: any) => entry.month > windowStartTimestamp
  );
  const totalMonthlyRequestsCount = requestsWithinWindow.reduce(
    (accumulator: any, entry: any) => accumulator + entry.requestCount,
    0
  );

  if (totalMonthlyRequestsCount >= MAX_MONTHLY_REQUEST_COUNT) {
    invalidTraffic(
      `You have exceeded the ${MAX_MONTHLY_REQUEST_COUNT} requests per month limit!`,
      res
    );
    return;
  }

  const lastRequestLog = data[data.length - 1];
  const potentialCurrentMonthStartTimeStamp = currentMonth.unix();

  if (lastRequestLog.month === potentialCurrentMonthStartTimeStamp) {
    lastRequestLog.requestCount++;
    data[data.length - 1] = lastRequestLog;
  } else {
    data.push({ month: potentialCurrentMonthStartTimeStamp, requestCount: 1 });
  }

  await redisClient.set(`user:${userId}`, JSON.stringify(data));
  next();
};
export const globalAppRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const WINDOW_SIZE_IN_MINUTES = 1;
  const MAX_WINDOW_REQUEST_COUNT = 50;
  const WINDOW_LOG_INTERVAL_IN_SECONDS = 10;

  if (!redisClient.isOpen) await redisClient.connect();

  const currentRequestTime = moment();
  const record = await redisClient.get(`app-rate-limiter:${currentRequestTime.minute()}`);
  const data = record
    ? JSON.parse(record)
    : [{ requestTimeStamp: currentRequestTime.unix(), requestCount: 0 }];
  const windowStartTimestamp = moment()
    .subtract(WINDOW_SIZE_IN_MINUTES, "minutes")
    .unix();
  const requestsWithinWindow = data.filter(
    (entry: any) => entry.requestTimeStamp > windowStartTimestamp
  );
  const totalWindowRequestsCount = requestsWithinWindow.reduce(
    (accumulator: any, entry: any) => accumulator + entry.requestCount,
    0
  );

  if (totalWindowRequestsCount >= MAX_WINDOW_REQUEST_COUNT) {
    invalidTraffic(
      `The app has exceeded the ${MAX_WINDOW_REQUEST_COUNT} requests in ${WINDOW_SIZE_IN_MINUTES} minute limit!`,
      res
    );
    return;
  }

  const lastRequestLog = data[data.length - 1];
  const potentialCurrentWindowIntervalStartTimeStamp = currentRequestTime
    .subtract(WINDOW_LOG_INTERVAL_IN_SECONDS, "seconds")
    .unix();

  if (
    lastRequestLog.requestTimeStamp >
    potentialCurrentWindowIntervalStartTimeStamp
  ) {
    lastRequestLog.requestCount++;
    data[data.length - 1] = lastRequestLog;
  } else {
    data.push({ requestTimeStamp: currentRequestTime.unix(), requestCount: 1 });
  }

  await redisClient.set(
    `app-rate-limiter:${currentRequestTime.minute()}`,
    JSON.stringify(data),
    {
      EX: WINDOW_SIZE_IN_MINUTES * 60,
    }
  );

  next();
};

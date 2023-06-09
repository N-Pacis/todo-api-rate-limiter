import { NextFunction, Request, Response } from "express";
import moment from "moment";
import { createClient } from "redis";
import { invalidTraffic } from "./api.response";

const WINDOW_LOG_INTERVAL_IN_SECONDS = 10;
const WINDOW_SIZE_IN_MONTHS = 1;
const WINDOW_SIZE_IN_SECONDS = 60;
const WINDOW_SIZE_IN_MINUTES = 1;

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

export const rateLimiterByIp = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  const MAX_WINDOW_REQUEST_COUNT = process.env.USER_MAX_REQUESTS_PER_MINUTE || 1;
  if (!redisClient.isOpen) await redisClient.connect();

  const ip = req.ip;
  const record = await redisClient.get(`address:${ip}`);
  const currentTimestamp = moment().unix();
  const data = record
    ? JSON.parse(record)
    : [{ timestamp: currentTimestamp, requestCount: 0 }];
  const windowStartTimestamp = currentTimestamp - WINDOW_SIZE_IN_SECONDS;
  const requestsWithinWindow = data.filter(
    (entry: any) => entry.timestamp > windowStartTimestamp
  );
  const totalWindowRequestsCount = requestsWithinWindow.reduce(
    (accumulator: any, entry: any) => accumulator + entry.requestCount,
    0
  );


  if (totalWindowRequestsCount >= MAX_WINDOW_REQUEST_COUNT) {
    invalidTraffic(
      `You have exceeded the ${MAX_WINDOW_REQUEST_COUNT} requests in ${WINDOW_SIZE_IN_SECONDS} second limit!`,
      res
    );
    return;
  }

  const lastRequestLog = data[data.length - 1];
  const potentialCurrentWindowIntervalStartTimeStamp =
    currentTimestamp - (WINDOW_SIZE_IN_SECONDS - 1);

  if (lastRequestLog.timestamp > potentialCurrentWindowIntervalStartTimeStamp) {
    lastRequestLog.requestCount++;
    data[data.length - 1] = lastRequestLog;
  } else {
    data.push({ timestamp: currentTimestamp, requestCount: 1 });
  }

  await redisClient.set(`address:${ip}`, JSON.stringify(data));
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
  const MAX_MONTHLY_REQUEST_COUNT = process.env.USER_MAX_REQUESTS_MONTHLY || 1;

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
  const MAX_WINDOW_REQUEST_COUNT = Number(process.env.APP_MAX_REQUESTS_PER_MINUTE) || 1;

  if (!redisClient.isOpen) await redisClient.connect();

  const appRateLimiterCache = new Map<
    string,
    { requestTimeStamp: number; requestCount: number }[]
  >();

  const currentRequestTime = moment().unix();
  const windowStartTimestamp = currentRequestTime - WINDOW_SIZE_IN_MINUTES * 60;

  let requestsWithinWindow: {
    requestTimeStamp: number;
    requestCount: number;
  }[] = [];
  let totalWindowRequestsCount = 0;
  const cacheKey = `app-rate-limiter:${Math.floor(currentRequestTime / 60)}`;

  if (appRateLimiterCache.has(cacheKey)) {
    requestsWithinWindow = appRateLimiterCache
      .get(cacheKey)!
      .filter((entry) => entry.requestTimeStamp > windowStartTimestamp);
    totalWindowRequestsCount = requestsWithinWindow.reduce(
      (acc, entry) => acc + entry.requestCount,
      0
    );
  } else {
    const redisRecord = await redisClient.get(cacheKey);
    if (redisRecord) {
      const redisData = JSON.parse(redisRecord);
      requestsWithinWindow = redisData.filter(
        (entry: any) => entry.requestTimeStamp > windowStartTimestamp
      );
      totalWindowRequestsCount = requestsWithinWindow.reduce(
        (acc, entry) => acc + entry.requestCount,
        0
      );
    }
  }

  if (totalWindowRequestsCount >= MAX_WINDOW_REQUEST_COUNT) {
    invalidTraffic(
      `The app has exceeded the ${MAX_WINDOW_REQUEST_COUNT} requests in ${WINDOW_SIZE_IN_MINUTES} minute limit!`,
      res
    );
    return;
  }

  let lastRequestLog: { requestTimeStamp: number; requestCount: number } = {
    requestTimeStamp: 0,
    requestCount: 0,
  };
  if (requestsWithinWindow.length > 0) {
    lastRequestLog = requestsWithinWindow[requestsWithinWindow.length - 1];
  }

  const potentialCurrentWindowIntervalStartTimeStamp =
    currentRequestTime - WINDOW_LOG_INTERVAL_IN_SECONDS;
  if (
    lastRequestLog.requestTimeStamp >
    potentialCurrentWindowIntervalStartTimeStamp
  ) {
    lastRequestLog.requestCount++;
    requestsWithinWindow[requestsWithinWindow.length - 1] = lastRequestLog;
  } else {
    requestsWithinWindow.push({
      requestTimeStamp: currentRequestTime,
      requestCount: 1,
    });
  }

  appRateLimiterCache.set(cacheKey, requestsWithinWindow);

  await redisClient.set(cacheKey, JSON.stringify(requestsWithinWindow), {
    EX: WINDOW_SIZE_IN_MINUTES * 60,
  });

  next();
};

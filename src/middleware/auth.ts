import { Request, Response, NextFunction } from 'express';
import asyncErrorMiddleware from './asyncError';
import ErrorHandler from '../utils/errorHandler';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { redis } from '../utils/redis';

// for protecting routes: only authenticated users can access certain resources
export const isAuthenticated = asyncErrorMiddleware(async(req: Request, res: Response, next: NextFunction) => {
    const access_token = req.cookies.access_token;

    if(!access_token) {
        return next(new ErrorHandler('Please login before accessing this route', 400));
    }

    const decoded = jwt.verify(access_token, process.env.ACCESS_TOKEN as string) as JwtPayload;

    if(!decoded) {
        return next(new ErrorHandler('please login before accessing this route', 400));
    }

    const user = await redis.get(decoded.id);

    if(!user) {
        return next(new ErrorHandler('user not found', 400));
    }

    req.user = JSON.parse(user);
    next();
});

// for protecting admin only routes: check the role of the requesting user.
export const authorizeRole = (...roles: string[]) => {
    return (req: Request, res:Response, next: NextFunction) => {
        if(!roles.includes(req.user?.role || '')) {
            return next(new ErrorHandler(`Role: ${req.user?.role} is not allowed to access this resource`, 403));
        }

        next();
    }
}
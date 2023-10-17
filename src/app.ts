import dotenv from 'dotenv';
import express, { Express, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import errorMiddleware from './middleware/error';
export const app: Express = express();

// dotenv
dotenv.config();

// body parser
app.use(express.json({ limit: '50mb' }))

// cookie parser
app.use(cookieParser());

// cors
app.use(cors({
    origin: process.env.ORIGINS
}));

// tesing api url
app.get('/test', (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({
        success: true,
        message: 'api is working'
    })
});

// unknown route
app.all('*', (req: Request, res: Response, next: NextFunction) => {
    const err = new Error(`Route ${req.originalUrl} not found`) as any;
    err.statusCode = 404;
    next(err);
})

// error middleware
app.use(errorMiddleware);
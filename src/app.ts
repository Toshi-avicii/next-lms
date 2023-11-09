import dotenv from 'dotenv';
import express, { Express, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import errorMiddleware from './middleware/error';
import userRouter from './routes/user.route';
import courseRouter from './routes/course.route';

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

// routes
app.use('/api/v1', userRouter);
app.use('/api/v1', courseRouter);

// tesing api url
app.get('/test', (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({
        success: true,
        message: 'api is working'
    })
});

// catch all the routes which are not available
app.all('*', (req: Request, res: Response, next: NextFunction) => {
    const err = new Error(`Route ${req.originalUrl} not found`) as any;
    err.statusCode = 404;
    next(err);
})

// error middleware
app.use(errorMiddleware);
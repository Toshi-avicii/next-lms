import ErrorHandler from "../utils/errorHandler";
import asyncErrorMiddleware from "../middleware/asyncError";
import userModel, { IUser } from "../models/user.model";
import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload, Secret } from 'jsonwebtoken';
import dotenv from 'dotenv';
// import ejs from 'ejs';
// import path from "path";
import sendMail from "../utils/sendMail";
import { accessTokenOptions, refreshTokenOptions, sendToken } from "../utils/jwt";
import { redis } from "../utils/redis";

dotenv.config();

interface RegisterationBody {
    name: string;
    email: string;
    password: string;
    avatar?: string;
}

interface ActivationToken {
    token: string;
    activationCode: string;
}

interface ActivationRequest {
    activation_token: string;
    activation_code: string;
}

interface LoginRequest {
    email: string;
    password: string;
}

export const registerUser = asyncErrorMiddleware(async(req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password } = req.body;
        // if the user's email is already in db, then don't let them register
        const isEmailExist = await userModel.findOne({ email });

        if(isEmailExist) {
            return next(new ErrorHandler('Email already exists', 400));
        }

        // if the user doesn't exist in the db, let them register
        const user: RegisterationBody = {
            name,
            email,
            password
        };

        const activationToken = createActivationToken(user);
        const activationCode = activationToken.activationCode;

        const data = {
            user: { 
                name: user.name
            },
            activationCode
        }

        // const html = ejs.renderFile(path.join(__dirname, '../templates/activation-mail.ejs'), data);

        // try to send an email with the account activation code,
        try {
            await sendMail({
                email: user.email,
                subject: 'Activate your account',
                template: "activation-mail.ejs",
                data
            });

            res.status(201).json({
                success: true,
                message: `Please check your email: ${user.email} for activation code.`,
                activationToken: activationToken.token
            })
        } catch(err: any) {
            res.status(400).json({
                success: false,
                message: 'request failed'
            })
        }

    } catch(err: any) {
        return next(new ErrorHandler(err.message, 400))
    }
});

export const createActivationToken = (user: RegisterationBody): ActivationToken => {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const token = jwt.sign({
        user, activationCode
    }, process.env.ACTIVATION_SECRET as Secret, {
        expiresIn: '1d'
    });

    return {
        activationCode,
        token
    }
}

export const activateUser = asyncErrorMiddleware(async(req: Request, res: Response, next: NextFunction) => {
    try {
        const { activation_code, activation_token } = req.body as ActivationRequest;
        const newUser: { user: IUser; activationCode: string } = jwt.verify(
            activation_token,
            process.env.ACTIVATION_SECRET as string
        ) as { user: IUser; activationCode: string }

        if(newUser.activationCode !== activation_code) {
            return next(new ErrorHandler('Invalid activation code', 400));
        }

        const { name, email, password } = newUser.user;

        const existingUser = await userModel.findOne({ email });

        if(existingUser) {
            return next(new ErrorHandler('User already exists', 400));
        }

        const user = await userModel.create({
            name, 
            email,
            password
        });

        res.status(201).json({
            success: true 
        })
    } catch(err: any) {
        return next(new ErrorHandler(err.message, 400))
    }

});

// login user
export const loginUser = asyncErrorMiddleware(async(req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body as LoginRequest;

        // if email or password is missing
        if(!email || !password) {
            return next(new ErrorHandler('Please enter email or password', 400));
        }

        // select email and password
        const userExist = await userModel.findOne({ email }).select('+password');

        // if the user does not exist
        if(!userExist) {
            return next(new ErrorHandler('User does not exist', 400));
        }

        const passwordMatch = await userExist.comparePassword(password);

        if(!passwordMatch) {
            return next(new ErrorHandler('Password does not match', 400));
        }

        // if both email and password are okay then send access token and refresh token as cookies
        sendToken(userExist, 200, res);

    } catch(err: any) {
        return next(new ErrorHandler(err.message, 400));
    }
});

// logout user
export const logoutUser = asyncErrorMiddleware(async(req: Request, res: Response, next: NextFunction) => {
    try {
        res.cookie("access_token", "", { maxAge: 1 });
        res.cookie("refresh_token", "", { maxAge: 1 });

        const userId = req.user?._id || '';

        redis.del(userId);

        res.status(200).json({
            success: true,
            message: "user logged out successfully"
        })
    } catch(err: any) {
        return next(new ErrorHandler(err.message, 400));
    }
})

// update user access token
export const updateAccessToken = asyncErrorMiddleware(async(req: Request, res: Response, next: NextFunction) => {
    try {
        // creating access token on the basis of refresh token
        const refresh_token = req.cookies.refresh_token as string;
        const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN as string) as JwtPayload;
        const message = 'Could not refresh token';

        if(!decoded) {
            return next(new ErrorHandler(message, 400));
        }

        const session = await redis.get(decoded.id as string);

        if(!session) {
            return next(new ErrorHandler(message, 400));
        }

        const user = JSON.parse(session);
        const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN as string, {
            expiresIn: "5m"
        });

        const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN as string, {
            expiresIn: "3d"
        });

        res.cookie("access_token", accessToken, accessTokenOptions);
        res.cookie("refresh_token", refreshToken, refreshTokenOptions);

        res.status(200).json({
            success: true,
            accessToken
        })

    } catch(err: any) {
        return next(new ErrorHandler(err.message, 400));
    }
})

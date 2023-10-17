import ErrorHandler from "../utils/errorHandler";
import asyncErrorMiddleware from "../middleware/asyncError";
import userModel from "../models/user.model";
import { NextFunction, Request, Response } from "express";
import jwt, { Secret } from 'jsonwebtoken';
import dotenv from 'dotenv';
import ejs from 'ejs';
import path from "path";
import sendMail from "../utils/sendMail";

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

        console.log(user);

        // const html = ejs.renderFile(path.join(__dirname, '../templates/activation-mail.ejs'), data);


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
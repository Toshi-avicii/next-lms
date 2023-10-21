"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutUser = exports.loginUser = exports.activateUser = exports.createActivationToken = exports.registerUser = void 0;
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
const asyncError_1 = __importDefault(require("../middleware/asyncError"));
const user_model_1 = __importDefault(require("../models/user.model"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
// import ejs from 'ejs';
// import path from "path";
const sendMail_1 = __importDefault(require("../utils/sendMail"));
const jwt_1 = require("../utils/jwt");
dotenv_1.default.config();
exports.registerUser = (0, asyncError_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password } = req.body;
        // if the user's email is already in db, then don't let them register
        const isEmailExist = yield user_model_1.default.findOne({ email });
        if (isEmailExist) {
            return next(new errorHandler_1.default('Email already exists', 400));
        }
        // if the user doesn't exist in the db, let them register
        const user = {
            name,
            email,
            password
        };
        const activationToken = (0, exports.createActivationToken)(user);
        const activationCode = activationToken.activationCode;
        const data = {
            user: {
                name: user.name
            },
            activationCode
        };
        // const html = ejs.renderFile(path.join(__dirname, '../templates/activation-mail.ejs'), data);
        // try to send an email with the account activation code,
        try {
            yield (0, sendMail_1.default)({
                email: user.email,
                subject: 'Activate your account',
                template: "activation-mail.ejs",
                data
            });
            res.status(201).json({
                success: true,
                message: `Please check your email: ${user.email} for activation code.`,
                activationToken: activationToken.token
            });
        }
        catch (err) {
            res.status(400).json({
                success: false,
                message: 'request failed'
            });
        }
    }
    catch (err) {
        return next(new errorHandler_1.default(err.message, 400));
    }
}));
const createActivationToken = (user) => {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const token = jsonwebtoken_1.default.sign({
        user, activationCode
    }, process.env.ACTIVATION_SECRET, {
        expiresIn: '1d'
    });
    return {
        activationCode,
        token
    };
};
exports.createActivationToken = createActivationToken;
exports.activateUser = (0, asyncError_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { activation_code, activation_token } = req.body;
        const newUser = jsonwebtoken_1.default.verify(activation_token, process.env.ACTIVATION_SECRET);
        if (newUser.activationCode !== activation_code) {
            return next(new errorHandler_1.default('Invalid activation code', 400));
        }
        const { name, email, password } = newUser.user;
        const existingUser = yield user_model_1.default.findOne({ email });
        if (existingUser) {
            return next(new errorHandler_1.default('User already exists', 400));
        }
        const user = yield user_model_1.default.create({
            name,
            email,
            password
        });
        res.status(201).json({
            success: true
        });
    }
    catch (err) {
        return next(new errorHandler_1.default(err.message, 400));
    }
}));
// login user
exports.loginUser = (0, asyncError_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        // if email or password is missing
        if (!email || !password) {
            return next(new errorHandler_1.default('Please enter email or password', 400));
        }
        // select email and password
        const userExist = yield user_model_1.default.findOne({ email }).select('+password');
        // if the user does not exist
        if (!userExist) {
            return next(new errorHandler_1.default('User does not exist', 400));
        }
        const passwordMatch = yield userExist.comparePassword(password);
        if (!passwordMatch) {
            return next(new errorHandler_1.default('Password does not match', 400));
        }
        // if both email and password are okay then send access token and refresh token as cookies
        (0, jwt_1.sendToken)(userExist, 200, res);
    }
    catch (err) {
        return next(new errorHandler_1.default(err.message, 400));
    }
}));
// logout user
exports.logoutUser = (0, asyncError_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.cookie("access_token", "", { maxAge: 1 });
        res.cookie("refresh_token", "", { maxAge: 1 });
        res.status(200).json({
            success: true,
            message: "user logged out successfully"
        });
    }
    catch (err) {
        return next(new errorHandler_1.default(err.message, 400));
    }
}));

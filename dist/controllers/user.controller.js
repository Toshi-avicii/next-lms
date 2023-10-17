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
exports.createActivationToken = exports.registerUser = void 0;
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
const asyncError_1 = __importDefault(require("../middleware/asyncError"));
const user_model_1 = __importDefault(require("../models/user.model"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const sendMail_1 = __importDefault(require("../utils/sendMail"));
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
        console.log(user);
        // const html = ejs.renderFile(path.join(__dirname, '../templates/activation-mail.ejs'), data);
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

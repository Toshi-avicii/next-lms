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
exports.updateUserProfileAvatar = exports.updateUserPassword = exports.updateUserInfo = exports.socialAuth = exports.getUserInfo = exports.updateAccessToken = exports.logoutUser = exports.loginUser = exports.activateUser = exports.createActivationToken = exports.registerUser = void 0;
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
const asyncError_1 = __importDefault(require("../middleware/asyncError"));
const user_model_1 = __importDefault(require("../models/user.model"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
// import ejs from 'ejs';
// import path from "path";
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const sendMail_1 = __importDefault(require("../utils/sendMail"));
const jwt_1 = require("../utils/jwt");
const redis_1 = require("../utils/redis");
const user_service_1 = require("../services/user.service");
const cloudinary_1 = __importDefault(require("cloudinary"));
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
    var _a;
    try {
        res.cookie("access_token", "", { maxAge: 1 });
        res.cookie("refresh_token", "", { maxAge: 1 });
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || '';
        redis_1.redis.del(userId);
        res.status(200).json({
            success: true,
            message: "user logged out successfully"
        });
    }
    catch (err) {
        return next(new errorHandler_1.default(err.message, 400));
    }
}));
// update user access token
exports.updateAccessToken = (0, asyncError_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // creating access token on the basis of refresh token
        const refresh_token = req.cookies.refresh_token;
        const decoded = jsonwebtoken_1.default.verify(refresh_token, process.env.REFRESH_TOKEN);
        const message = 'Could not refresh token';
        if (!decoded) {
            return next(new errorHandler_1.default(message, 400));
        }
        const session = yield redis_1.redis.get(decoded.id);
        if (!session) {
            return next(new errorHandler_1.default(message, 400));
        }
        const user = JSON.parse(session);
        const accessToken = jsonwebtoken_1.default.sign({ id: user._id }, process.env.ACCESS_TOKEN, {
            expiresIn: "5m"
        });
        const refreshToken = jsonwebtoken_1.default.sign({ id: user._id }, process.env.REFRESH_TOKEN, {
            expiresIn: "3d"
        });
        req.user = user;
        res.cookie("access_token", accessToken, jwt_1.accessTokenOptions);
        res.cookie("refresh_token", refreshToken, jwt_1.refreshTokenOptions);
        res.status(200).json({
            success: true,
            accessToken
        });
    }
    catch (err) {
        return next(new errorHandler_1.default(err.message, 400));
    }
}));
// get user info
exports.getUserInfo = (0, asyncError_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
        (0, user_service_1.getUserById)(userId, res);
    }
    catch (err) {
        return next(new errorHandler_1.default(err.message, 400));
    }
}));
// social auth
exports.socialAuth = (0, asyncError_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { avatar, name, email, password } = req.body;
        const user = yield user_model_1.default.findOne({ email });
        if (!user) {
            const newUser = yield user_model_1.default.create({ name, email, avatar, password });
            (0, jwt_1.sendToken)(newUser, 200, res);
        }
        else {
            (0, jwt_1.sendToken)(user, 200, res);
        }
    }
    catch (err) {
        return next(new errorHandler_1.default(err.message, 400));
    }
}));
// update user info
exports.updateUserInfo = (0, asyncError_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
        const { name, email } = req.body;
        const userId = (_c = req.user) === null || _c === void 0 ? void 0 : _c._id;
        const user = yield user_model_1.default.findById(userId);
        let updatedUser;
        if (!req.body) {
            return next(new errorHandler_1.default('request body is empty', 400));
        }
        if (email && user) {
            const isEmailExist = yield user_model_1.default.findOne({ email });
            if (isEmailExist) {
                return next(new errorHandler_1.default('user email already exists', 400));
            }
            updatedUser = yield user_model_1.default.findByIdAndUpdate(userId, { $set: { email } }, { new: true });
        }
        if (name && user) {
            updatedUser = yield user_model_1.default.findByIdAndUpdate(userId, { $set: { name } }, { new: true });
        }
        yield redis_1.redis.set(userId, JSON.stringify(updatedUser));
        res.status(201).json({
            success: true,
            updatedUser
        });
    }
    catch (err) {
        return next(new errorHandler_1.default(err.message, 400));
    }
}));
// update user password
exports.updateUserPassword = (0, asyncError_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _d, _e;
    try {
        const { newPassword, oldPassword } = req.body;
        const userId = (_d = req.user) === null || _d === void 0 ? void 0 : _d._id;
        const user = yield user_model_1.default.findById((_e = req.user) === null || _e === void 0 ? void 0 : _e._id).select("+password");
        let updatedUser;
        if (!oldPassword || !newPassword) {
            return next(new errorHandler_1.default('password is undefined', 400));
        }
        if (!(user === null || user === void 0 ? void 0 : user.password)) {
            return next(new errorHandler_1.default('password is undefined', 400));
        }
        const passwordMatch = yield user.comparePassword(oldPassword);
        if (!passwordMatch) {
            return next(new errorHandler_1.default('password does not match', 400));
        }
        updatedUser = yield user_model_1.default.findOneAndUpdate({ _id: userId }, { $set: { password: yield bcryptjs_1.default.hash(newPassword, 10) } }, { new: true });
        redis_1.redis.set(userId, JSON.stringify(updatedUser));
        res.status(201).json({
            success: true,
            updatedUser
        });
    }
    catch (err) {
        return next(new errorHandler_1.default(err.message, 400));
    }
}));
// update user profile avatar
exports.updateUserProfileAvatar = (0, asyncError_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _f, _g, _h;
    try {
        const { avatar } = req.body;
        const userId = (_f = req.user) === null || _f === void 0 ? void 0 : _f._id;
        const user = yield user_model_1.default.findById(userId);
        let updatedUser;
        if (avatar && user) {
            // if we have any previous pic then this will run,
            if ((_g = user === null || user === void 0 ? void 0 : user.avatar) === null || _g === void 0 ? void 0 : _g.public_id) {
                // delete the old profile pic first
                yield cloudinary_1.default.v2.uploader.destroy((_h = user === null || user === void 0 ? void 0 : user.avatar) === null || _h === void 0 ? void 0 : _h.public_id);
                // save the new profile pic after deleting the previous one.
                const myCloud = yield cloudinary_1.default.v2.uploader.upload(avatar, {
                    folder: "avatars",
                    width: 150
                });
                // update the url of the avatar in the db.
                updatedUser = yield user_model_1.default.findByIdAndUpdate(userId, { $set: { avatar: { public_id: myCloud.public_id, url: myCloud.url } } }, { new: true });
            }
            else { // if we don't have any previous pic, then it will run
                const myCloud = yield cloudinary_1.default.v2.uploader.upload(avatar, {
                    folder: "avatars",
                    width: 150
                });
                updatedUser = yield user_model_1.default.findByIdAndUpdate(userId, { $set: { avatar: { public_id: myCloud.public_id, url: myCloud.url } } }, { new: true });
            }
        }
        yield redis_1.redis.set(userId, JSON.stringify(updatedUser));
        res.status(201).json({
            success: true,
            updatedUser
        });
    }
    catch (err) {
        return next(new errorHandler_1.default(err.message, 400));
    }
}));

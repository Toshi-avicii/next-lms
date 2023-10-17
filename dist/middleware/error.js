"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
const errorMiddleware = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || 'Internal server error';
    // wrong mongodb id error
    if (err.name === "CastError") {
        const message = `Resource not found, Invalid: ${err.path}`;
        err = new errorHandler_1.default(message, 400);
    }
    // duplicate key error
    if (err.code === 11000) {
        const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
        err = new errorHandler_1.default(message, 400);
    }
    // json web token error
    if (err.name === "JsonWebTokenError") {
        const message = `Jsonwebtoken is invalid, try again`;
        err = new errorHandler_1.default(message, 400);
    }
    // jwt expire error
    if (err.name === "TokenExpiredError") {
        const message = `Jsonwebtoken is expired, try again`;
        err = new errorHandler_1.default(message, 400);
    }
    res.status(err.statusCode).json({
        success: false,
        message: err.message
    });
};
exports.default = errorMiddleware;

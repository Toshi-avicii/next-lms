"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const error_1 = __importDefault(require("./middleware/error"));
const user_route_1 = __importDefault(require("./routes/user.route"));
const course_route_1 = __importDefault(require("./routes/course.route"));
exports.app = (0, express_1.default)();
// dotenv
dotenv_1.default.config();
// body parser
exports.app.use(express_1.default.json({ limit: '50mb' }));
// cookie parser
exports.app.use((0, cookie_parser_1.default)());
// cors
exports.app.use((0, cors_1.default)({
    origin: process.env.ORIGINS
}));
// routes
exports.app.use('/api/v1', user_route_1.default);
exports.app.use('/api/v1', course_route_1.default);
// tesing api url
exports.app.get('/test', (req, res, next) => {
    res.status(200).json({
        success: true,
        message: 'api is working'
    });
});
// catch all the routes which are not available
exports.app.all('*', (req, res, next) => {
    const err = new Error(`Route ${req.originalUrl} not found`);
    err.statusCode = 404;
    next(err);
});
// error middleware
exports.app.use(error_1.default);

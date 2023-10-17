"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const asyncErrorMiddleware = (theFunc) => (req, res, next) => {
    Promise.resolve(theFunc(req, res, next)).catch(next);
};
exports.default = asyncErrorMiddleware;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const course_controller_1 = require("../controllers/course.controller");
const auth_1 = require("../middleware/auth");
const courseRouter = express_1.default.Router();
courseRouter.post('/create-course', auth_1.isAuthenticated, (0, auth_1.authorizeRole)('admin'), course_controller_1.uploadCourse);
courseRouter.put('/edit-course/:courseId', auth_1.isAuthenticated, (0, auth_1.authorizeRole)('admin'), course_controller_1.editCourse);
courseRouter.get('/course/:courseId', course_controller_1.getSingleCourse);
courseRouter.get('/courses', course_controller_1.getAllCourses);
exports.default = courseRouter;

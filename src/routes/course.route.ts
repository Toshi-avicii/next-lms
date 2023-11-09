import express from 'express';
import { editCourse, getAllCourses, getSingleCourse, uploadCourse } from '../controllers/course.controller';
import { authorizeRole, isAuthenticated } from '../middleware/auth';
const courseRouter = express.Router();

courseRouter.post('/create-course', isAuthenticated, authorizeRole('admin'), uploadCourse);
courseRouter.put('/edit-course/:courseId', isAuthenticated, authorizeRole('admin'), editCourse);
courseRouter.get('/course/:courseId', getSingleCourse);
courseRouter.get('/courses', getAllCourses);

export default courseRouter;
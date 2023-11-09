import { NextFunction, Response, Request } from 'express';
import asyncErrorMiddleware from '../middleware/asyncError';
import ErrorHandler from '../utils/errorHandler';
import cloudinary from 'cloudinary';
import { createCourse } from '../services/course.service';
import courseModel from '../models/course.model';
import { redis } from '../utils/redis';

// upload course
export const uploadCourse = asyncErrorMiddleware(async(req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.body; 
        const thumbnail = data.thumbnail;
        if(thumbnail) {
            const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
                folder: "courses"
            });

            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url
            }
        }
        await createCourse(data, res, next);
    } catch(err: any) {
        return next(new ErrorHandler(err.message, 400));
    }
});

// edit course
export const editCourse = asyncErrorMiddleware(async(req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.body;
        const thumbnail = data.thumbnail;

        if(thumbnail) {
            await cloudinary.v2.uploader.destroy(thumbnail.public_id);

            const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
                folder: "courses"
            });

            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url
            }
        }

        const { courseId } = req.params;
        console.log(courseId); 

        const course = await courseModel.findByIdAndUpdate(courseId, {
            $set: data
        }, {
            new: true
        });

        res.status(201).json({
            success: true,
            course
        })
    } catch(err: any) {
        return next(new ErrorHandler(err.message, 400));
    }
});

// get single course --without purchasing it 
export const getSingleCourse = asyncErrorMiddleware(async(req: Request, res: Response, next: NextFunction) => {
    try {
        const { courseId } = req.params;

        // if we have this course saved in redis cache then we will send that course from redis
        // instead of mongodb, because redis is fast than mongodb as redis caches data.
        const isCacheExist = await redis.get(courseId);
        if(isCacheExist) {
            const course = JSON.parse(isCacheExist);
            res.status(200).json({
                success: true,
                course
            });
        } else {
            const course = await courseModel.findById(courseId).select(
                "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
            );
            
            // saving it in cached db so that we don't have to always call mongodb
            await redis.set(courseId, JSON.stringify(course));

            res.status(200).json({
                success: true,
                course
            })
        }

    } catch(err: any) { 
        return next(new ErrorHandler(err.message, 500));
    }
});

// get all courses --without purchasing it
export const getAllCourses = asyncErrorMiddleware(async(req: Request, res: Response, next: NextFunction) => {
    try {
        const isCacheExist = await redis.get("allCourses");

        if(isCacheExist) {
            const courses = JSON.parse(isCacheExist);
            res.status(200).json({
                success: true,
                courses
            })
        } else {
            const courses = await courseModel.find().select(
                "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
            );

            await redis.set("allCourses", JSON.stringify(courses));

            res.status(200).json({
                success: true,
                courses
            })

        }

    } catch(err: any) { 
        return next(new ErrorHandler(err.message, 500));
    }
});
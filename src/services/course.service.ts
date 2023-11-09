import { NextFunction, Response, response } from "express";
import courseModel from "../models/course.model";
import asyncErrorMiddleware from "../middleware/asyncError";

// create course
export const createCourse = asyncErrorMiddleware(async(data: any, res: Response, next: NextFunction) => {
    const course = await courseModel.create(data);
    res.status(201).json({
        success: true,
        course
    });
});
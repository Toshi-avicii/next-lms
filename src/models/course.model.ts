import mongoose, { Document, Model, Schema } from "mongoose";

interface Comment extends Document {
    user: object;
    comment: string;
    commentReplies?: Comment[];
}

interface Review extends Document {
    user: object;
    rating: number;
    comment: string;
    commentReplies: Comment[];
}

interface CourseLink extends Document {
    title: string;
    url: string;
}

interface CourseData extends Document {
    title: string;
    description: string;
    videoUrl: string;
    videoThumbnail: object;
    videoSection: string;
    videoLength: number;
    videoPlayer: string;
    links: CourseLink[];
    suggestion: string;
    questions: Comment[];  
}

export interface Course extends Document {
    name: string;
    description: string;
    price: number;
    estimatedPrice ?: number;
    thumbnail: object;
    tags: string;
    level: string;
    demoUrl: string;
    benifits: { title: string }[];
    prerequisites: { title: string }[];
    reviews: Review[];
    courseData: CourseData[];
    ratings?: number;
    purchased?: number;
}

const reviewSchema = new Schema<Review>({
  user: Object,
  rating: {
    type: Number,
    default: 0
  },
  comment: String,
});

const linkSchema = new Schema<CourseLink>({
    title: String,
    url: String  
});

const commentSchema = new Schema<Comment>({
    user: Object,
    comment: String,
    commentReplies: [Object]
});

const courseDataSchema = new Schema<CourseData>({
    title: String,
    description: String,
    videoUrl: String,
    videoSection: String,
    videoLength: Number,
    videoPlayer: String,
    links: [linkSchema],
    suggestion: String,
    questions: [commentSchema]
});

const courseSchema = new Schema<Course>({
    name: {
        type: String,
        required: [true, 'please enter a course name']
    },
    description: {
        type: String,
        required: [true, 'please enter a course description']
    },
    price: {
        type: Number,
        required: [true, 'please enter a course price']
    },
    estimatedPrice: {
        type: Number,
        required: false
    },
    thumbnail: {
        public_id: {
            type: String,
        },
        url: {
            type: String,
        }
    },
    tags: {
        type: String,
        required: true
    },
    level: {
        type: String,
        required: [true, 'please enter a course level']
    },
    demoUrl: {
        type: String,
        required: true
    },
    benifits: [{
        title: {
            type: String,
            required: true
        }
    }],
    prerequisites: [{
        title: {
            type: String,
            required: true
        }
    }],
    reviews: [reviewSchema],
    courseData: [courseDataSchema],
    ratings: {
        type: Number,
        default: 0
    },
    purchased: {
        type: Number,
        default: 0
    }
});

const courseModel: Model<Course> = mongoose.model("Course", courseSchema);

export default courseModel;
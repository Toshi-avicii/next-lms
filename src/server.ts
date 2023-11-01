import { app } from "./app";
import dotenv from 'dotenv';
import connectDb from "./utils/db";
import { v2 } from 'cloudinary';

// including .env file
dotenv.config();

v2.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET_KEY
});

// create server
app.listen(process.env.PORT, () => {
    console.log(`server is running on port ${process.env.PORT}`);
    connectDb();
}) 
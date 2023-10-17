import { app } from "./app";
import dotenv from 'dotenv';
import connectDb from "./utils/db";
import { redis } from "./utils/redis";

// including .env file
dotenv.config();

// create server
app.listen(process.env.PORT, () => {
    console.log(`server is running on port ${process.env.PORT}`);
    connectDb();
    console.log(redis);
}) 
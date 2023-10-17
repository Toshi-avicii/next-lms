import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl: string = process.env.DB_URI || '';

// mongodb database connection method
const connectDb = async () => {
    try {
        await mongoose.connect(dbUrl).then((data: any) => {
            console.log(`Database connected successfully with ${data.connection.host}`)
        })
    } catch(err: any) {
        console.log(err.message);
        setTimeout(connectDb, 5000);
    }
}

export default connectDb;
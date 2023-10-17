"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = __importDefault(require("./utils/db"));
const redis_1 = require("./utils/redis");
// including .env file
dotenv_1.default.config();
// create server
app_1.app.listen(process.env.PORT, () => {
    console.log(`server is running on port ${process.env.PORT}`);
    (0, db_1.default)();
    console.log(redis_1.redis);
});

import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}))

app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());


// route import
import userRouter from "./routes/user.route.js"
import superAdminRouter from "./routes/superAdmin.route.js"
import superAdminDashboardRouter from "./routes/superAdminDashboard.route.js"
import templeAdminRouter from "./routes/templeAdmin.route.js"
import templeDetailsRouter from "./routes/templeDetails.route.js"
import templeReviewRouter from "./routes/reviews.route.js"
import templeCarouselRouter from "./routes/carousel.route.js"
import transactionRouter from "./routes/transaction.route.js";

import { errorHandler } from "./utils/errorHandler.js"

// route declaration 
app.use("/api/v1/users", userRouter);
app.use("/api/v1/superAdmin", superAdminRouter);
app.use("/api/v1/superAdminDashboard", superAdminDashboardRouter);
app.use("/api/v1/templeAdmin", templeAdminRouter);
app.use("/api/v1/templeDetails", templeDetailsRouter);
app.use("/api/v1/reviews", templeReviewRouter);
app.use("/api/v1/carousel", templeCarouselRouter);
app.use("/api/v1/transactions", transactionRouter);

app.use(errorHandler);

// http://localhost:5000/api/v1/users/register
// http://localhost:5000/api/v1/users/login
// http://localhost:5000/api/v1/users/logout

export {app}
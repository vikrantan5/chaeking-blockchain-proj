import crypto from "crypto";
import { sendEmail } from "./sendEmail.js";
import { emailForOtpVerification } from "./emailTemplateForOTP.js";
import { ApiError } from "./ApiError.js";

const resendOtpUtility = async (user, emailSubject) => {
    // Check if 30 seconds have passed since the last OTP was sent
    const currentTime = Date.now();
    const lastOtpSentTime = user.resetOtpExpires - 5 * 60 * 1000; // Subtract OTP validity duration (5 minutes)
    if (currentTime - lastOtpSentTime < 60 * 1000) {
        throw new ApiError(400, `You can resend OTP only after ${Math.ceil((60000 - (currentTime - lastOtpSentTime)) / 1000)} seconds. `);
    }

    // Generate a new OTP
    const otp = crypto.randomBytes(3).toString("hex");
    user.resetOtp = otp;
    user.resetOtpExpires = Date.now() + 5 * 60 * 1000; // OTP valid for 5 minutes
    user.lastOtpSentAt = Date.now(); 
    await user.save({ validateBeforeSave: false });

    // Send OTP email
    const otpEmail = emailForOtpVerification(user.email, otp);
    try {
        await sendEmail(user.email, emailSubject, otpEmail);
    } catch (error) {
        throw new ApiError(500, "Failed to send OTP email");
    }

    return {
        success: true,
        message: "OTP resent successfully. Please check your email.",
    };
};

export { resendOtpUtility };
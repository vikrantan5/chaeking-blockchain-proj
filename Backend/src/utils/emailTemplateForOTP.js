const emailForOtpVerification = (email, otp, context) => {
    let message = "";

    if (context === "emailVerification") {
        message = `
Hello ${email},

Thank you for registering with us! Please use the OTP below to verify your email address:

OTP: ${otp}

This OTP is valid for 5 minutes.
If you did not request this, please ignore this email.

Thank you,
Your App Team`;
    } else if (context === "passwordReset") {
        message = `
Hello ${email},

You requested to reset your password. Use the OTP below to reset your password:

OTP: ${otp}

This OTP is valid for 5 minutes.
If you did not request this, please ignore this email.

Thank you,
Your App Team`;
    } else {
        message = `
Hello ${email},

Use the OTP below for your requested action:

OTP: ${otp}

This OTP is valid for 5 minutes.
If you did not request this, please ignore this email.

Thank you,
Your App Team`;
    }

    return message;
};

export { emailForOtpVerification };
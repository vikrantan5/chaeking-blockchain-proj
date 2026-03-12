const emailForOtpVerification = (email, otp, purpose = "emailVerification") => {
    const purposes = {
        emailVerification: {
            title: "Email Verification",
            message: "Thank you for registering! Please verify your email address to complete your registration."
        },
        passwordReset: {
            title: "Password Reset",
            message: "You have requested to reset your password. Use the OTP below to proceed."
        },
        ngoRegistration: {
            title: "NGO Registration Verification",
            message: "Thank you for registering your NGO! Please verify your email address to complete the NGO registration process."
        }
    };

    const { title, message } = purposes[purpose] || purposes.emailVerification;

    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            background-color: #f4f4f9;
            margin: 0;
            padding: 0;
        }
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .email-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .email-body {
            padding: 30px;
            color: #333;
        }
        .otp-box {
            background: #f8f9fa;
            border: 2px dashed #667eea;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
        }
        .otp-code {
            font-size: 32px;
            font-weight: bold;
            color: #667eea;
            letter-spacing: 8px;
            margin: 10px 0;
        }
        .expiry-text {
            color: #e74c3c;
            font-size: 14px;
            margin-top: 10px;
        }
        .email-footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        .warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>🔐 ${title}</h1>
        </div>
        
        <div class="email-body">
            <p>Hello,</p>
            <p>${message}</p>
            
            <div class="otp-box">
                <p style="margin: 0; font-size: 14px; color: #666;">Your verification code is:</p>
                <div class="otp-code">${otp}</div>
                <p class="expiry-text">⏰ This OTP will expire in 10 minutes</p>
            </div>
            
            <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <p style="margin: 5px 0 0 0; font-size: 13px;">
                    Never share this OTP with anyone. Our team will never ask for your OTP via phone or email.
                </p>
            </div>
            
            <p>If you didn't request this verification, please ignore this email.</p>
        </div>
        
        <div class="email-footer">
            <p>© 2025 NGO Donation Platform. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
        </div>
    </div>
</body>
</html>
    `;
};

export { emailForOtpVerification };

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

    // Return object with proper email structure
    return {
        subject: `${title} - OTP Verification`,
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>${title}</title>
    <style>
        /* Inline styles are better for email clients */
        body {
            font-family: 'Arial', sans-serif;
            background-color: #f4f4f9;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .email-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            padding: 30px 20px;
            text-align: center;
        }
        .email-header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .email-body {
            padding: 40px 30px;
            color: #333333;
            line-height: 1.6;
        }
        .email-body p {
            margin: 0 0 20px 0;
            font-size: 16px;
        }
        .otp-box {
            background: #f8f9fa;
            border: 2px dashed #667eea;
            border-radius: 8px;
            padding: 25px 20px;
            text-align: center;
            margin: 30px 0;
        }
        .otp-label {
            margin: 0 0 10px 0;
            font-size: 14px;
            color: #666666;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .otp-code {
            font-size: 42px;
            font-weight: bold;
            color: #667eea;
            letter-spacing: 8px;
            margin: 15px 0;
            font-family: 'Courier New', monospace;
            line-height: 1.2;
        }
        .expiry-text {
            color: #e74c3c;
            font-size: 14px;
            margin: 10px 0 0 0;
            font-weight: 500;
        }
        .warning-box {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 20px;
            margin: 30px 0;
            border-radius: 4px;
        }
        .warning-box strong {
            color: #856404;
            font-size: 15px;
            display: block;
            margin-bottom: 8px;
        }
        .warning-box p {
            margin: 0;
            font-size: 14px;
            color: #856404;
        }
        .email-footer {
            background: #f8f9fa;
            padding: 30px 20px;
            text-align: center;
            font-size: 13px;
            color: #666666;
            border-top: 1px solid #e9ecef;
        }
        .email-footer p {
            margin: 5px 0;
        }
        .email-footer a {
            color: #667eea;
            text-decoration: none;
        }
        @media only screen and (max-width: 600px) {
            .email-body {
                padding: 30px 20px;
            }
            .otp-code {
                font-size: 32px;
                letter-spacing: 4px;
            }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f9;">
    <div style="padding: 20px 10px;">
        <div class="email-container">
            <!-- Header -->
            <div class="email-header">
                <h1 style="margin: 0;">🔐 ${title}</h1>
            </div>
            
            <!-- Body -->
            <div class="email-body">
                <p style="margin: 0 0 20px 0;">Hello,</p>
                <p style="margin: 0 0 20px 0;">${message}</p>
                
                <!-- OTP Box -->
                <div class="otp-box">
                    <p class="otp-label" style="margin: 0 0 10px 0;">Your verification code is:</p>
                    <div class="otp-code" style="font-size: 42px; font-weight: bold; color: #667eea; letter-spacing: 8px; margin: 15px 0;">${otp}</div>
                    <p class="expiry-text" style="margin: 10px 0 0 0;">⏰ This OTP will expire in 10 minutes</p>
                </div>
                
                <!-- Security Notice -->
                <div class="warning-box">
                    <strong style="color: #856404; font-size: 15px; display: block; margin-bottom: 8px;">⚠️ Security Notice:</strong>
                    <p style="margin: 0; font-size: 14px; color: #856404;">Never share this OTP with anyone. Our team will never ask for your OTP via phone or email.</p>
                </div>
                
                <p style="margin: 0;">If you didn't request this verification, please ignore this email.</p>
            </div>
            
            <!-- Footer -->
            <div class="email-footer">
                <p style="margin: 5px 0;">© 2025 NGO Donation Platform. All rights reserved.</p>
                <p style="margin: 5px 0;">This is an automated email. Please do not reply.</p>
                <p style="margin: 10px 0 0 0;">
                    <a href="#" style="color: #667eea; text-decoration: none;">Privacy Policy</a> • 
                    <a href="#" style="color: #667eea; text-decoration: none;">Contact Support</a>
                </p>
            </div>
        </div>
    </div>
</body>
</html>
        `,
        text: `${title}\n\nHello,\n\n${message}\n\nYour verification code is: ${otp}\n\nThis OTP will expire in 10 minutes.\n\nSecurity Notice: Never share this OTP with anyone. Our team will never ask for your OTP via phone or email.\n\nIf you didn't request this verification, please ignore this email.\n\n© 2025 NGO Donation Platform. All rights reserved.`
    };
};

export { emailForOtpVerification };
const templeAdminRegistrationEmail = (name, email, plainPassword) => {
    return {
        subject: "Your Temple Admin Account Has Been Created",
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Temple Admin Account Created</title>
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
        .email-header h1 {
            margin: 0;
            font-size: 28px;
        }
        .email-body {
            padding: 40px 30px;
            color: #333;
            line-height: 1.6;
        }
        .credentials-box {
            background: #f8f9fa;
            border: 2px solid #667eea;
            border-radius: 8px;
            padding: 25px;
            margin: 30px 0;
        }
        .credentials-box h3 {
            margin: 0 0 20px 0;
            color: #667eea;
            font-size: 18px;
            text-align: center;
        }
        .credential-item {
            margin: 15px 0;
            padding: 10px;
            background: white;
            border-radius: 6px;
            border-left: 4px solid #667eea;
        }
        .credential-label {
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
        }
        .credential-value {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            font-family: 'Courier New', monospace;
            word-break: break-all;
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
            display: block;
            margin-bottom: 10px;
            font-size: 16px;
        }
        .warning-box p {
            margin: 0;
            color: #856404;
            font-size: 14px;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
        }
        .email-footer {
            background: #f8f9fa;
            padding: 30px;
            text-align: center;
            font-size: 13px;
            color: #666;
            border-top: 1px solid #e9ecef;
        }
        @media only screen and (max-width: 600px) {
            .email-body {
                padding: 30px 20px;
            }
            .credential-value {
                font-size: 16px;
            }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f9;">
    <div style="padding: 20px 10px;">
        <div class="email-container">
            <!-- Header -->
            <div class="email-header">
                <h1>🏛️ Temple Admin Account Created</h1>
            </div>
            
            <!-- Body -->
            <div class="email-body">
                <p style="margin: 0 0 20px 0;">Hello <strong>${name}</strong>,</p>
                
                <p style="margin: 0 0 20px 0;">Your Temple Admin account has been created successfully. Below are your login credentials:</p>
                
                <!-- Credentials Box -->
                <div class="credentials-box">
                    <h3 style="margin: 0 0 20px 0;">🔑 Login Credentials</h3>
                    
                    <div class="credential-item">
                        <div class="credential-label">Email Address:</div>
                        <div class="credential-value">${email}</div>
                    </div>
                    
                    <div class="credential-item">
                        <div class="credential-label">Password:</div>
                        <div class="credential-value">${plainPassword}</div>
                    </div>
                </div>
                
                <!-- Action Button -->
                <div style="text-align: center;">
                    <a href="${process.env.PLATFORM_URL || '#'}/login" class="button" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold;">Login to Platform</a>
                </div>
                
                <!-- Important Notice -->
                <div class="warning-box">
                    <strong>⚠️ Important Security Notice:</strong>
                    <p>For security reasons, please change your password immediately after your first login. Never share your credentials with anyone.</p>
                </div>
                
                <!-- Next Steps -->
                <div style="margin: 30px 0 0 0;">
                    <h4 style="color: #333; margin: 0 0 15px 0;">Next Steps:</h4>
                    <ol style="margin: 0; padding-left: 20px; color: #666;">
                        <li style="margin-bottom: 10px;">Click the login button above or visit our platform</li>
                        <li style="margin-bottom: 10px;">Use the credentials provided to sign in</li>
                        <li style="margin-bottom: 10px;">You'll be prompted to change your password</li>
                        <li style="margin-bottom: 10px;">Complete your temple profile and settings</li>
                    </ol>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="email-footer">
                <p style="margin: 5px 0;">© ${new Date().getFullYear()} Temple Fund Platform. All rights reserved.</p>
                <p style="margin: 5px 0;">This is an automated email. Please do not reply.</p>
                <p style="margin: 15px 0 0 0; font-size: 12px;">
                    If you didn't request this account creation, please contact support immediately.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
        `,
        text: `
Hello ${name},

Your Temple Admin account has been created successfully.

================================
LOGIN CREDENTIALS
================================
Email: ${email}
Password: ${plainPassword}
================================

Login to the platform at: ${process.env.PLATFORM_URL || '[Platform URL]'}/login

IMPORTANT SECURITY NOTICE:
For security reasons, please change your password immediately after your first login. Never share your credentials with anyone.

Next Steps:
1. Visit the platform and login with the credentials above
2. You'll be prompted to change your password
3. Complete your temple profile and settings

If you didn't request this account creation, please contact support immediately.

Regards,
Temple Fund Platform
        `
    };
};

export { templeAdminRegistrationEmail };
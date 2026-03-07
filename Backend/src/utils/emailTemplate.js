const templeAdminRegistrationEmail = (name, email, plainPassword) => {
    return `
Hello ${name},

Your Temple Admin account has been created successfully.

Login Credentials:
Email: ${email}
Password: ${plainPassword}

Login to the platform and update your password after first login.

Regards,
Temple Fund Platform
    `;
};

export { templeAdminRegistrationEmail };
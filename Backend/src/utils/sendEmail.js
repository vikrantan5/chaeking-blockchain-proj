import nodemailer from "nodemailer";

const sendEmail = async (to, subject, text) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const info = await transporter.sendMail({
            from: `"Temple Fund System" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
        });
    } catch (error) {
        console.error("Error sending email:", error.message);
        throw new Error("Failed to send email. Please try again later.");
    }
};

export { sendEmail };
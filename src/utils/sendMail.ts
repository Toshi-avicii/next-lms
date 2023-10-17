import nodemailer, { Transporter } from 'nodemailer';
import ejs from 'ejs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

interface EmailOptions {
    email: string;
    subject: string;
    template: string;
    data: {
        [key: string]: any
    }
}

const sendMail = async(options: EmailOptions):Promise<void> => {
    const transporter: Transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        service: process.env.SMTP_SERVICE,
        auth: {
            user: process.env.SMTP_MAIL,
            pass: process.env.SMTP_PASSWORD
        }
    });

    const { email, data, template, subject } = options;

    // get the path to the email template file
    const templatePath = path.join(__dirname, '../templates', template);

    // render the email template with ejs
    const html: string = await ejs.renderFile(templatePath, data);

    // send the mail
    await transporter.sendMail({
        from: process.env.SMTP_MAIL,
        to: email,
        subject,
        html
    })
}

export default sendMail;
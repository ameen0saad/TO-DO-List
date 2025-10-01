import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import { __dirname } from './path.js';
import path from 'path';

const loadTemplate = async (templatePath, replacements) => {
  try {
    let template = await fs.readFile(templatePath, 'utf-8');
    Object.keys(replacements).forEach(
      (key) => (template = template.replaceAll(`{{${key}}}`, replacements[key]))
    );
    return template;
  } catch (error) {
    throw error;
  }
};
class Email {
  constructor(user, url) {
    this.to = user.email;
    this.name = user.name;
    this.url = url;
    this.from = `Task Manager < ${process.env.EMAIL_FROM}`;
  }
  newTransport() {
    if (process.env.NODE_ENV == 'production')
      return nodemailer.createTransport({
        host: process.env.TURBO_EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.TURBO_USERNAME,
          pass: process.env.TURBO_PASSWORD,
        },
      });
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }
  async send(template, subject) {
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html: template,
    };
    await this.newTransport().sendMail(mailOptions);
  }
  async sendWelcome() {
    const templatePath = path.join(__dirname, '../public/html/email/welcome.html');
    const template = await loadTemplate(templatePath, {
      USER_NAME: this.name,
      URL: this.url,
      YEAR: new Date().getFullYear(),
    });
    await this.send(template, 'Welcome to the Task Manager App!');
  }

  async sendVerification() {
    const templatePath = path.join(__dirname, '../public/html/email/verification.html');
    const template = await loadTemplate(templatePath, {
      USER_NAME: this.name,
      VERIFICATION_URL: this.url,
      YEAR: new Date().getFullYear(),
    });
    await this.send(template, 'Your verification token (valid for only 60 minutes)');
  }
  async sendOtp(otp) {
    const templatePath = path.join(__dirname, '../public/html/email/resetPassword.html');
    const template = await loadTemplate(templatePath, {
      USER_NAME: this.name,
      OTP: otp,
      YEAR: new Date().getFullYear(),
    });
    await this.send(template, 'Your password reset OTP (valid for only 10 minutes)');
  }
}

export default Email;

import nodemailer from 'nodemailer';
import SibApiV3Sdk from 'sib-api-v3-sdk';
import fs from 'fs/promises';
import { __dirname } from './path.js';
import path from 'path';

const defaulClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaulClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;
const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

const loadTemplate = async (templatePath, replacements) => {
  try {
    let template = await fs.readFile(templatePath, 'utf-8');
    Object.keys(replacements).forEach(
      (key) => (template = template.replaceAll(`{{${key}}}`, replacements[key]))
    );
    return template;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
class Email {
  constructor(user, url) {
    this.to = user.email;
    this.name = user.name;
    this.url = url;
    this.from = `${process.env.EMAIL_FROM}`;
    this.sender = {
      email: process.env.EMAIL_FROM,
      name: 'Ameen',
    };
    this.receivers = [
      {
        email: user.email,
        name: user.name,
      },
    ];
  }

  async send(template, subject) {
    try {
      await tranEmailApi.sendTransacEmail({
        sender: this.sender,
        to: this.receivers,
        subject,
        htmlContent: template,
      });
    } catch (error) {
      console.log(error);
    }
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

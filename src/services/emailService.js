import nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true', // Use TLS if SMTP_SECURE is 'true'
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmail(to, subject, template, context) {
  try {
    // Read the template file
    const templatePath = path.join(__dirname, '..', '..', 'email-templates', `${template}.hbs`);
    const templateContent = await fs.readFile(templatePath, 'utf-8');

    // Compile the template
    const compiledTemplate = Handlebars.compile(templateContent);

    // Render the template with the provided context
    const html = compiledTemplate(context);

    // Send the email
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });

    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

export async function sendClaimSubmissionEmail(to, claim) {
  await sendEmail(
    to,
    'Your Warranty Claim Has Been Submitted',
    'claim-submission',
    { claim }
  );
}

export async function sendClaimStatusUpdateEmail(to, claim) {
  await sendEmail(
    to,
    'Your Warranty Claim Status Has Been Updated',
    'claim-status-update',
    { claim }
  );
}

export async function sendVerificationEmail(to, token) {
  const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${token}`;
  await sendEmail(
    to,
    'Verify Your Email',
    'email-verification',
    { verificationLink }
  );
}

export async function sendTicketUpdateEmail(to, orderNumber) {
  await sendEmail(
    to,
    'New Update on Your Support Ticket',
    'ticket-update',
    { orderNumber }
  );
}
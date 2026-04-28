const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async ({ to, subject, html, text }) => {
  const mailOptions = {
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to,
    subject,
    html,
    text,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
};

const emailTemplates = {
  passwordReset: (name, resetUrl) => ({
    subject: 'Meal-Box - Password Reset Request',
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;">
        <div style="background:#FF6B00;padding:20px;text-align:center;">
          <h1 style="color:white;margin:0;">🍱 Meal-Box</h1>
        </div>
        <div style="padding:30px;background:#fff;">
          <h2>Hi ${name},</h2>
          <p>You requested to reset your password. Click the button below:</p>
          <a href="${resetUrl}" style="display:inline-block;background:#FF6B00;color:white;padding:12px 30px;border-radius:8px;text-decoration:none;margin:20px 0;">
            Reset Password
          </a>
          <p style="color:#666;font-size:14px;">This link expires in 10 minutes. If you didn't request this, ignore this email.</p>
        </div>
      </div>
    `,
  }),
  orderConfirmation: (name, orderNumber, totalAmount) => ({
    subject: `Meal-Box - Order #${orderNumber} Confirmed! 🎉`,
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;">
        <div style="background:#FF6B00;padding:20px;text-align:center;">
          <h1 style="color:white;margin:0;">🍱 Meal-Box</h1>
        </div>
        <div style="padding:30px;background:#fff;">
          <h2>Thank you, ${name}! 🎉</h2>
          <p>Your order <strong>#${orderNumber}</strong> has been confirmed.</p>
          <p>Total Amount: <strong>₹${totalAmount}</strong></p>
          <p>We'll notify you when your food is being prepared. Estimated delivery: 30-45 minutes.</p>
        </div>
      </div>
    `,
  }),
};

module.exports = { sendEmail, emailTemplates };

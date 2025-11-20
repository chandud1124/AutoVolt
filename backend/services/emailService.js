const nodemailer = require('nodemailer');

// Function to check if email is configured
const isEmailConfigured = () => {
  const emailDisabled = process.env.EMAIL_DISABLED === 'true';
  return !!(process.env.EMAIL_USERNAME && process.env.EMAIL_PASSWORD && process.env.EMAIL_FROM) && !emailDisabled;
};

// Create transporter only when needed
let transporter = null;
const getTransporter = () => {
  if (!transporter && isEmailConfigured()) {
    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    // Optional verification (non-blocking)
    transporter.verify().then(() => {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[email] transporter verified');
      }
    }).catch(err => {
      console.error('[email] transporter verification failed:', err.message);
    });
  }
  return transporter;
};

const sendPasswordResetEmail = async (email, resetUrl) => {
  if (!isEmailConfigured()) {
    console.log('[email:fallback] Password reset link for', email, '=>', resetUrl);
    return true; // pretend success in dev fallback
  }
  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h1>You have requested to reset your password</h1>
        <p>Please click the following link to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link will expire in 1 hour</p>
        <p>If you did not request this, please ignore this email</p>
      `
    });
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
};

const sendTempPasswordEmail = async (email, tempPassword) => {
  if (!isEmailConfigured()) {
    console.log('[email:fallback] Temp password for', email, '=>', tempPassword);
    return true;
  }
  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Your Temporary Account Password',
      html: `
        <p>An account has been created for you.</p>
        <p>Temporary password: <strong>${tempPassword}</strong></p>
        <p>Please log in and change this password immediately.</p>
      `
    });
    return true;
  } catch (error) {
    console.error('Temp password email error:', error);
    return false;
  }
};

const sendPasswordChangedEmail = async (email) => {
  if (!isEmailConfigured()) {
    console.log('[email:fallback] Password changed notification for', email);
    return true;
  }
  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Your Password Was Changed',
      html: `<p>This is a confirmation that your password was just changed. If you did not do this, contact support immediately.</p>`
    });
    return true;
  } catch (error) {
    console.error('Password changed email error:', error);
    return false;
  }
};

const sendEmailVerification = async (email, verificationUrl, userName) => {
  if (!isEmailConfigured()) {
    console.log('[email:fallback] Email verification link for', email, '=>', verificationUrl);
    console.log('[email:fallback] In production, user would receive verification email');
    return true; // Pretend success in dev fallback
  }
  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Verify Your AutoVolt Account Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">AutoVolt IoT</h1>
            <p style="color: white; margin: 10px 0 0 0;">Smart Power Management System</p>
          </div>
          <div style="background: #f8f9fa; padding: 40px 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Hello ${userName}!</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Thank you for registering with AutoVolt. To complete your registration and verify your email address, please click the button below:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">Verify Email Address</a>
            </div>
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              Or copy and paste this link into your browser:
            </p>
            <p style="color: #667eea; font-size: 14px; word-break: break-all; background: white; padding: 15px; border-radius: 5px; border: 1px solid #e0e0e0;">
              ${verificationUrl}
            </p>
            <p style="color: #999; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              ⏱️ This verification link will expire in <strong>24 hours</strong>.<br>
              ⚠️ If you did not create an account, please ignore this email.
            </p>
          </div>
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p>© 2025 AutoVolt IoT System. All rights reserved.</p>
          </div>
        </div>
      `
    });
    return true;
  } catch (error) {
    console.error('Email verification send error:', error);
    return false;
  }
};

module.exports = { 
  sendPasswordResetEmail, 
  sendTempPasswordEmail, 
  sendPasswordChangedEmail,
  sendEmailVerification 
};

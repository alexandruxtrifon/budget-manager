const nodemailer = require('nodemailer');
require('dotenv').config();
const { pool } = require('../db');



// Initialize transporter with Ethereal Mail for testing
let transporter;
let isInitialized = false;
async function createTestAccount() {
  if (isInitialized) return;
  try {
    // Create Ethereal test account
    const testAccount = await nodemailer.createTestAccount();
    
    // Create reusable transporter using the SMTP transport
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    isInitialized = true;  
    console.log('Created Ethereal Mail test account:', {
      user: testAccount.user,
      pass: testAccount.pass,
      preview: 'https://ethereal.email'
    });
    return true;
  } catch (error) {
    console.error('Failed to create test email account:', error);
    return false;
  }
}

// Send welcome email
async function sendWelcomeEmail(recipient, name) {
  if (!isInitialized) {
    const success = await createTestAccount();
    if (!success) {
      console.error('Failed to initialize email transporter');
      return false;
    }
  }
  try {
    const info = await transporter.sendMail({
      from: '"Budget Manager" <budgetmanager@example.com>',
      to: recipient,
      subject: 'Welcome to Budget Manager!',
      text: 
        `Hello ${name},\n\n` +
        `Welcome to Budget Manager! We're excited to have you on board.\n\n` +
        `With our app, you can:\n` +
        `- Track your income and expenses\n` +
        `- Set budgets for different categories\n` +
        `- Get insights into your spending habits\n` +
        `- Plan for the future with financial goals\n\n` +
        `Get started by adding your first account and transaction.\n\n` +
        `If you have any questions, feel free to reach out to our support team.\n\n` +
        `Best regards,\n` +
        `The Budget Manager Team`,
      html: 
        `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #4a6ee0;">Welcome to Budget Manager!</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>We're excited to have you on board. Your journey to better financial management starts now!</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">With our app, you can:</h3>
            <ul>
              <li>Track your income and expenses</li>
              <li>Set budgets for different categories</li>
              <li>Get insights into your spending habits</li>
              <li>Plan for the future with financial goals</li>
            </ul>
          </div>
          <p>Get started by adding your first account and transaction.</p>
          <div style="margin: 25px 0;">
            <a href="http://localhost:3000/dashboard" style="background-color: #4a6ee0; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
          </div>
          <p>If you have any questions, feel free to reach out to our support team.</p>
          <p>Best regards,<br>The Budget Manager Team</p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #777;">
            <p>This is an automated message, please do not reply directly to this email.</p>
          </div>
        </div>`
    });

    console.log('Welcome email sent to %s', recipient);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    return {
        success: true,
        previewUrl: previewUrl
    };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return {
        success: false,
        error: error.message || 'Failed to send welcome email'
    };
  }
}

// Process notifications
async function processNotifications() {
  if (!isInitialized) {
    const success = await createTestAccount();
    if (!success) {
      console.error('Cannot process notifications - email transporter not initialized');
      return;
    }
  }
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Get unprocessed welcome_email notifications
    const result = await client.query(
      `SELECT n.notification_id, n.user_id, n.payload, u.email, u.full_name
       FROM notifications n
       JOIN users u ON n.user_id = u.user_id
       WHERE n.type = 'welcome_email' AND n.is_sent = false
       LIMIT 10`
    );

    console.log(`Found ${result.rows.length} pending welcome emails to process`);

    for (const notification of result.rows) {
      try {
        const payload = typeof notification.payload === 'string' ? 
          JSON.parse(notification.payload) : notification.payload;
          
        // Send email
        const emailResult = await sendWelcomeEmail(
          notification.email, 
          notification.full_name || 'New User'
        );
        
        if (emailResult.success) {
          // Mark notification as sent
          await client.query(
            `UPDATE notifications 
            SET is_sent = true, 
                payload = payload || $2::jsonb
            WHERE notification_id = $1`,
            [notification.notification_id, JSON.stringify({emailPreviewUrl: emailResult.previewUrl})]
            );
        console.log(`Marked notification ${notification.notification_id} as sent with preview URL`);
        }
      } catch (error) {
        console.error(`Error processing notification ${notification.notification_id}:`, error);
      }
    }

    await client.query('COMMIT');
    //console.log('Notification processing completed');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in notification processing:', error);
  } finally {
    client.release();
  }
}

// Initialize and start the service
async function init() {
  try {
    if (isInitialized) {
        testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    })
    }
    await createTestAccount();
    console.log('Email notification service initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize email service:', error);
    return false;
  }
}

module.exports = {
  init,
  sendWelcomeEmail,
  processNotifications
};

// If run directly (node emailService.js)
if (require.main === module) {
  init().then(() => processNotifications());
}
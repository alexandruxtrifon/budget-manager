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
async function processNotificationss() {
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

async function processNotifications() {
  try {
    // Ensure transporter is initialized
    if (!isInitialized) {
      await init();
      if (!isInitialized) {
        console.error("Email service failed to initialize");
        return;
      }
    }
    
    const client = await pool.connect();
    
    try {
        await processWelcomeEmails(client);
        await processOtpEmails(client);
    } 
    finally {
      client.release();
    }
    } catch (error) {
    console.error('Error in notification processing:', error);
    }
}

async function sendOtpEmail(recipient, name, otp) {
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
      subject: 'Verify Your Email - Budget Manager',
      text: 
        `Hello ${name},\n\n` +
        `Thank you for registering with Budget Manager! Please verify your email address using the verification code below:\n\n` +
        `Verification Code: ${otp}\n\n` +
        `This code will expire in 15 minutes.\n\n` +
        `If you didn't request this code, you can safely ignore this email.\n\n` +
        `Best regards,\n` +
        `The Budget Manager Team`,
      html: 
        `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #4a6ee0;">Verify Your Email</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>Thank you for registering with Budget Manager! Please verify your email address using the verification code below:</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
            <h1 style="font-size: 32px; font-family: monospace; letter-spacing: 5px; margin: 0; color: #333;">${otp}</h1>
          </div>
          <p>This code will expire in 15 minutes.</p>
          <p>If you didn't request this code, you can safely ignore this email.</p>
          <p>Best regards,<br>The Budget Manager Team</p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #777;">
            <p>This is an automated message, please do not reply directly to this email.</p>
          </div>
        </div>`
    });

    

    console.log('OTP email sent to %s', recipient);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log('Preview URL: %s', previewUrl);
    return {
        success: true,
        previewUrl: previewUrl
    };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return {
        success: false,
        error: error.message || 'Failed to send OTP email'
    };
  }
}

async function processOtpEmails(client) {
  // Get pending OTP emails
  const result = await client.query(
    `SELECT n.notification_id, n.user_id, n.payload, u.email, u.full_name
     FROM notifications n
     JOIN users u ON n.user_id = u.user_id
     WHERE n.type = 'otp_email' AND n.is_sent = false
     LIMIT 10`
  );
  
  if (result.rows.length !== 0) {
    console.log(`Found ${result.rows.length} pending OTP emails to process`);
  }

  for (const notification of result.rows) {
    try {
      await client.query('BEGIN');
      
      const payload = typeof notification.payload === 'string' ? 
        JSON.parse(notification.payload) : notification.payload;
      
      // Send OTP email
      const emailResult = await sendOtpEmail(
        notification.email,
        notification.full_name || 'User',
        payload.otp
      );
      
      if (emailResult.success) {
        // Mark notification as sent
        await client.query(
          `UPDATE notifications 
           SET is_sent = true, 
               payload = COALESCE(payload, '{}'::jsonb) || $2::jsonb
           WHERE notification_id = $1`,
          [notification.notification_id, JSON.stringify({emailPreviewUrl: emailResult.previewUrl})]
        );
        console.log(`OTP notification ${notification.notification_id} updated with preview URL`);
        await client.query('COMMIT');
      } else {
        await client.query('ROLLBACK');
      }
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`Error processing OTP notification ${notification.notification_id}:`, error);
    }
  }
}

async function processWelcomeEmails(client) {
    // Process each notification with its own transaction
      const result = await client.query(
        `SELECT n.notification_id, n.user_id, n.payload, u.email, u.full_name
         FROM notifications n
         JOIN users u ON n.user_id = u.user_id
         WHERE n.type = 'welcome_email' AND n.is_sent = false
         LIMIT 10`
      );
      if (result.rows.length !== 0) {
      console.log(`Found ${result.rows.length} pending welcome emails to process`);
      }
      
      // Process each notification with its own transaction
      for (const notification of result.rows) {
        try {
          await client.query('BEGIN');
          
          const emailResult = await sendWelcomeEmail(
            notification.email,
            notification.full_name || 'New User'
          );
          
          if (emailResult.success) {
            // Handle case where payload might be null
            await client.query(
              `UPDATE notifications 
               SET is_sent = true, 
                   payload = COALESCE(payload, '{}'::jsonb) || $2::jsonb
               WHERE notification_id = $1`,
              [notification.notification_id, JSON.stringify({emailPreviewUrl: emailResult.previewUrl})]
            );
            console.log(`Notification ${notification.notification_id} updated with preview URL: ${emailResult.previewUrl}`);
            await client.query('COMMIT');
          } else {
            await client.query('ROLLBACK');
          }
        }
        catch (error) {
          await client.query('ROLLBACK');
          console.error(`Error processing notification ${notification.notification_id}:`, error);
        }
    }
    
}

const handleResendOtp = async () => {
  if (!forgotEmail) return
  
  try {
    setCanResend(false)
    
    const res = await fetch("http://localhost:3001/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: forgotEmail }),
    })
    
    if (res.ok) {
      const data = await res.json()
      if (data.notification_id) {
        localStorage.setItem('notification_id', data.notification_id)
        console.log("Updated notification_id in localStorage:", data.notification_id)
      }
      
      toast.success("Reset code resent to your email")
      startTimer()
    } else {
      const data = await res.json()
      toast.error(data.error || "Failed to resend OTP")
      setCanResend(true)
    }
  } catch (error) {
    console.error("Failed to resend OTP:", error)
    toast.error("Failed to resend reset code. Please try again.")
    setCanResend(true)
  }
}

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
    });
    await transporter.verify();
        isInitialized = true;
    console.log('Email service initialized with account:', {
      user: testAccount.user,
      pass: testAccount.pass,
      preview: 'https://ethereal.email'
    });

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
  processNotifications,
  sendOtpEmail
};

// If run directly (node emailService.js)
if (require.main === module) {
  init().then(() => processNotifications());
}
/**
 * Test script to verify email service configuration (Resend or SendGrid)
 * Run with: npx tsx scripts/test-email.ts
 */

import * as dotenv from 'dotenv';
import { generateSigningEmail, sendEmail } from '../lib/email-service';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testEmailService() {
  console.log('🔍 Testing Email Service Configuration...\n');

  // Check environment variables
  const resendKey = process.env.RESEND_KEY;
  const sendGridKey = process.env.AUTH_SENDGRID_KEY;
  const emailFrom = process.env.EMAIL_FROM;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  console.log('Environment Variables:');
  console.log(`  RESEND_KEY: ${resendKey ? '✅ Set' : '❌ Not set'}`);
  console.log(`  AUTH_SENDGRID_KEY: ${sendGridKey ? '✅ Set' : '❌ Not set'}`);
  console.log(`  EMAIL_FROM: ${emailFrom || '❌ Not set'}`);
  console.log(`  NEXT_PUBLIC_APP_URL: ${appUrl || '❌ Not set'}`);
  console.log('');

  const emailService = resendKey ? 'Resend' : sendGridKey ? 'SendGrid' : 'None';
  console.log(`📧 Email Service: ${emailService}\n`);

  if (!resendKey && !sendGridKey) {
    console.error('❌ No email service configured');
    console.error('Please set RESEND_KEY or AUTH_SENDGRID_KEY in .env.local');
    process.exit(1);
  }

  if (!emailFrom) {
    console.error('❌ EMAIL_FROM not set');
    console.error('Please set EMAIL_FROM in .env.local');
    process.exit(1);
  }

  // Test email generation
  console.log('📧 Generating test email...');
  const testEmail = generateSigningEmail({
    recipientName: 'Test Recipient',
    senderName: 'Test Sender',
    documentName: 'Test Document.pdf',
    signingUrl: `${appUrl || 'http://localhost:3000'}/sign/test-token-123`,
    message: 'This is a test message to verify the email service is working correctly.',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  });

  console.log('✅ Email HTML generated successfully\n');

  // Prompt for test email address
  console.log('📤 Ready to send test email');
  console.log(`   To: ${emailFrom} (using EMAIL_FROM as test recipient)`);
  console.log('   Subject: Test - Nutrient Sign Document Request\n');

  // Send test email
  console.log('Sending test email...');
  const result = await sendEmail({
    to: emailFrom, // Send to self for testing
    subject: 'Test - Nutrient Sign Document Request',
    html: testEmail,
  });

  if (result) {
    console.log('✅ Test email sent successfully!');
    console.log(`   Check your inbox at ${emailFrom}\n`);
    process.exit(0);
  } else {
    console.error('❌ Failed to send test email');
    console.error('   Check the SendGrid API key and try again');
    process.exit(1);
  }
}

testEmailService().catch((error) => {
  console.error('❌ Error running test:', error);
  process.exit(1);
});

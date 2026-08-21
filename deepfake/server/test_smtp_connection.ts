import { ENV } from './src/config/env';
import { EmailService } from './src/services/emailService';
import nodemailer from 'nodemailer';

async function testSmtpDiagnostic() {
  console.log('================================================================');
  console.log('📧 DEEPSHIELD SMTP EMAIL DELIVERY DIAGNOSTIC TOOL');
  console.log('================================================================\n');

  console.log('Checking Environment Configuration:');
  console.log(`- SMTP_HOST       : ${ENV.SMTP_HOST ? 'PRESENT (' + ENV.SMTP_HOST + ')' : 'MISSING ❌'}`);
  console.log(`- SMTP_PORT       : ${ENV.SMTP_PORT} (${ENV.SMTP_SECURE ? 'SSL' : 'STARTTLS'})`);
  console.log(`- SMTP_USER       : ${ENV.SMTP_USER ? 'PRESENT (' + ENV.SMTP_USER + ')' : 'MISSING ❌'}`);
  console.log(`- SMTP_PASSWORD   : ${ENV.SMTP_PASSWORD ? 'PRESENT (***configured***)' : 'MISSING ❌'}`);
  console.log(`- SMTP_FROM       : ${ENV.SMTP_FROM}`);
  console.log(`- CLIENT/FRONTEND : ${ENV.CLIENT_URL}\n`);

  if (!EmailService.isConfigured()) {
    console.log('----------------------------------------------------------------');
    console.log('❌ STATUS: SMTP configuration is incomplete or missing in .env.');
    console.log('Required variables in deepfake/.env:');
    console.log('  SMTP_HOST="smtp.gmail.com"');
    console.log('  SMTP_PORT=587');
    console.log('  SMTP_SECURE=false');
    console.log('  SMTP_USER="your-email@gmail.com"');
    console.log('  SMTP_PASSWORD="your-16-char-app-password"');
    console.log('  SMTP_FROM="DeepShield Enterprise Security <your-email@gmail.com>"');
    console.log('----------------------------------------------------------------\n');
    process.exit(1);
  }

  console.log('Attempting SMTP Transporter Handshake & Authentication...');
  const transporter = nodemailer.createTransport({
    host: ENV.SMTP_HOST,
    port: ENV.SMTP_PORT,
    secure: ENV.SMTP_SECURE,
    auth: {
      user: ENV.SMTP_USER,
      pass: ENV.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: ENV.NODE_ENV === 'production',
    },
  });

  try {
    await transporter.verify();
    console.log('✅ SMTP Connection & Authentication Successful!\n');

    const targetRecipient = process.argv[2] || ENV.SMTP_USER;
    console.log(`Sending real diagnostic test email to: ${targetRecipient}...`);

    const info = await transporter.sendMail({
      from: ENV.SMTP_FROM,
      to: targetRecipient,
      subject: 'DeepShield Verification Engine — SMTP Delivery Test',
      text: 'This is a live test email confirming that the DeepShield SMTP email delivery pipeline is operational.',
      html: `
        <div style="font-family: sans-serif; background: #070c1a; color: #fff; padding: 24px; border-radius: 12px;">
          <h2 style="color: #00e6a8;">🛡️ DeepShield SMTP Pipeline Operational</h2>
          <p>This email confirms that your outgoing SMTP server credentials are valid and live emails can now be delivered to recipient inboxes.</p>
          <p style="font-size: 11px; color: #64748b;">Timestamp: ${new Date().toISOString()}</p>
        </div>
      `,
    });

    console.log(`✅ Test Email Delivered Successfully!`);
    console.log(`- Message ID : ${info.messageId}`);
    console.log(`- Response   : ${info.response}\n`);
    console.log('================================================================');
  } catch (err: any) {
    console.error('\n❌ SMTP Handshake Failed:');
    console.error(`- Error Code   : ${err.code || 'UNKNOWN'}`);
    console.error(`- Error Message: ${err.message}`);
    if (err.message.includes('Invalid login') || err.message.includes('Username and Password not accepted') || err.code === 'EAUTH') {
      console.log('\n💡 Tip for Gmail accounts:');
      console.log('1. Enable 2-Step Verification on your Google Account.');
      console.log('2. Create an App Password at https://myaccount.google.com/apppasswords');
      console.log('3. Set SMTP_PASSWORD to the generated 16-character App Password.');
    }
    console.log('================================================================\n');
    process.exit(1);
  }
}

testSmtpDiagnostic();

import nodemailer from 'nodemailer';
import { logger } from './logger';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const baseTemplate = (content: string) => `
  <!DOCTYPE html>
  <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f6f2eb; margin:0; padding:40px 20px;">
      <div style="max-width:480px; margin:0 auto; background:#ffffff; border-radius:16px; border:1px solid #e2e8f0; padding:40px;">
        <div style="margin-bottom:28px;">
          <span style="font-size:16px; font-weight:600; color:#0f172a;">CrossPay</span>
        </div>
        ${content}
        <hr style="border:none; border-top:1px solid #f1f5f9; margin:28px 0 20px;" />
        <p style="color:#94a3b8; font-size:11px; margin:0;">CrossPay &bull; Cross-border stablecoin payments</p>
      </div>
    </body>
  </html>
`;

const buttonStyle = 'display:inline-block; background:#1f3b5c; color:#ffffff; text-decoration:none; padding:12px 28px; border-radius:8px; font-size:14px; font-weight:500;';

export const sendWelcomeEmail = async (toEmail: string): Promise<void> => {
  const mailOptions = {
    from: `"CrossPay" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'Your bank is cooked.',
    html: baseTemplate(`
      <h1 style="font-size:20px; font-weight:600; color:#0f172a; margin:0 0 12px;">Your bank is cooked.</h1>
      <p style="color:#475569; font-size:14px; line-height:1.6; margin:0 0 16px;">
        CrossPay is live on your account. Send money to anyone, anywhere, settled on Polygon in seconds.
        No SWIFT codes. No correspondent bank fees. No three-to-five business days of absolutely nothing happening.
      </p>
      <p style="color:#475569; font-size:14px; line-height:1.6; margin:0 0 24px;">
        Deposit, send, done. Your dashboard has the full picture.
      </p>
      <a href="${process.env.FRONTEND_URL}/dashboard" style="${buttonStyle}">Let's go</a>
      <p style="color:#94a3b8; font-size:12px; margin:24px 0 0;">
        Wrong inbox? Reply and we'll sort it.
      </p>
    `),
  };

  await transporter.sendMail(mailOptions);
  logger.info('Welcome email sent', { email: toEmail });
};

export const sendPasswordResetEmail = async (
  toEmail: string,
  resetLink: string
): Promise<void> => {
  const mailOptions = {
    from: `"CrossPay" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'Did you do this?',
    html: baseTemplate(`
      <h1 style="font-size:20px; font-weight:600; color:#0f172a; margin:0 0 12px;">Password reset for ${toEmail}</h1>
      <p style="color:#475569; font-size:14px; line-height:1.6; margin:0 0 8px;">
        Someone (hopefully you) asked to reset the password on this account.
      </p>
      <p style="color:#475569; font-size:14px; line-height:1.6; margin:0 0 24px;">
        The link below expires in 10 minutes. After that it's dead and you'll have to request another one.
      </p>
      <a href="${resetLink}" style="${buttonStyle}">Reset password</a>
      <p style="color:#94a3b8; font-size:12px; margin:24px 0 0;">
        Wasn't you? Ignore this. Your account is fine.
      </p>
    `),
  };

  await transporter.sendMail(mailOptions);
  logger.info('Password reset email sent', { email: toEmail });
};

export const sendTransferSentEmail = async (
  senderEmail: string,
  recipientEmail: string,
  amountGBP: number,
  amountUSDC: number,
  txHash: string | null
): Promise<void> => {
  const explorerLink = txHash ? `https://amoy.polygonscan.com/tx/${txHash}` : null;

  const mailOptions = {
    from: `"CrossPay" <${process.env.SMTP_USER}>`,
    to: senderEmail,
    subject: `£${amountGBP.toFixed(2)} left the building.`,
    html: baseTemplate(`
      <h1 style="font-size:20px; font-weight:600; color:#0f172a; margin:0 0 12px;">Money sent. Done. Gone.</h1>
      <p style="color:#475569; font-size:14px; line-height:1.6; margin:0 0 16px;">
        <strong>£${amountGBP.toFixed(2)}</strong> just left your account, converted to <strong>${amountUSDC.toFixed(6)} USDC</strong>, and is on its way to <strong>${recipientEmail}</strong> via Polygon. No bank involved. No 3–5 business days of nothing. Just done.
      </p>
      <table style="width:100%; border-collapse:collapse; font-size:13px; color:#475569; margin-bottom:24px;">
        <tr><td style="padding:6px 0; border-bottom:1px solid #f1f5f9;">You sent</td><td style="padding:6px 0; border-bottom:1px solid #f1f5f9; text-align:right; font-weight:600; color:#0f172a;">£${amountGBP.toFixed(2)}</td></tr>
        <tr><td style="padding:6px 0; border-bottom:1px solid #f1f5f9;">On-chain settlement</td><td style="padding:6px 0; border-bottom:1px solid #f1f5f9; text-align:right; font-weight:600; color:#0f172a;">${amountUSDC.toFixed(6)} USDC</td></tr>
        <tr><td style="padding:6px 0;">To</td><td style="padding:6px 0; text-align:right; color:#0f172a;">${recipientEmail}</td></tr>
      </table>
      ${explorerLink ? `<a href="${explorerLink}" style="${buttonStyle}">Verify on Polygon ↗</a>` : ''}
      <p style="color:#94a3b8; font-size:12px; margin:24px 0 0;">
        Wasn't you? Reply to this email or contact us at <a href="mailto:crosspayment.noreply@gmail.com" style="color:#1f3b5c;">crosspayment.noreply@gmail.com</a> immediately.
      </p>
    `),
  };

  await transporter.sendMail(mailOptions);
  logger.info('Transfer sent email delivered', { email: senderEmail });
};

export const sendTransferReceivedEmail = async (
  recipientEmail: string,
  senderEmail: string,
  amountGBP: number,
  amountUSDC: number,
  txHash: string | null
): Promise<void> => {
  const explorerLink = txHash ? `https://amoy.polygonscan.com/tx/${txHash}` : null;

  const mailOptions = {
    from: `"CrossPay" <${process.env.SMTP_USER}>`,
    to: recipientEmail,
    subject: `You just got paid. £${amountGBP.toFixed(2)} incoming.`,
    html: baseTemplate(`
      <h1 style="font-size:20px; font-weight:600; color:#0f172a; margin:0 0 12px;">Someone sent you money.</h1>
      <p style="color:#475569; font-size:14px; line-height:1.6; margin:0 0 16px;">
        <strong>${senderEmail}</strong> just dropped <strong>£${amountGBP.toFixed(2)}</strong> into your CrossPay wallet.
        That's <strong>${amountUSDC.toFixed(6)} USDC</strong> settled on Polygon. Already there. Already yours.
      </p>
      <table style="width:100%; border-collapse:collapse; font-size:13px; color:#475569; margin-bottom:24px;">
        <tr><td style="padding:6px 0; border-bottom:1px solid #f1f5f9;">You received</td><td style="padding:6px 0; border-bottom:1px solid #f1f5f9; text-align:right; font-weight:600; color:#0f172a;">£${amountGBP.toFixed(2)}</td></tr>
        <tr><td style="padding:6px 0; border-bottom:1px solid #f1f5f9;">USDC in wallet</td><td style="padding:6px 0; border-bottom:1px solid #f1f5f9; text-align:right; font-weight:600; color:#0f172a;">${amountUSDC.toFixed(6)} USDC</td></tr>
        <tr><td style="padding:6px 0;">From</td><td style="padding:6px 0; text-align:right; color:#0f172a;">${senderEmail}</td></tr>
      </table>
      ${explorerLink ? `<a href="${explorerLink}" style="${buttonStyle}">See it on Polygon ↗</a>` : ''}
      <a href="${process.env.FRONTEND_URL}/dashboard" style="${buttonStyle}; margin-left:${explorerLink ? '12px' : '0'};">Open dashboard</a>
      <p style="color:#94a3b8; font-size:12px; margin:24px 0 0;">
        Questions? Hit reply or email <a href="mailto:crosspayment.noreply@gmail.com" style="color:#1f3b5c;">crosspayment.noreply@gmail.com</a>.
      </p>
    `),
  };

  await transporter.sendMail(mailOptions);
  logger.info('Transfer received email delivered', { email: recipientEmail });
};

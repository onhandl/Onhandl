import nodemailer from 'nodemailer';

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function buildOtpHtml(otp: string, purpose: 'signup' | 'forgot_password'): string {
  const isSignup = purpose === 'signup';
  const title = isSignup ? 'Verify your email' : 'Reset your password';
  const subtitle = isSignup
    ? 'Welcome to Onhandl! Enter the code below to verify your email address and complete registration.'
    : 'Enter the code below to reset your Onhandl account password.';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#18181b;border-radius:16px;border:1px solid #27272a;overflow:hidden;max-width:480px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #27272a;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#7c3aed;border-radius:10px;width:36px;height:36px;text-align:center;vertical-align:middle;">
                    <span style="color:#fff;font-size:18px;font-weight:700;line-height:36px;">⚡</span>
                  </td>
                  <td style="padding-left:12px;">
                    <span style="color:#fafafa;font-size:18px;font-weight:700;letter-spacing:-0.3px;">Onhandl</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h1 style="margin:0 0 12px;color:#fafafa;font-size:22px;font-weight:700;letter-spacing:-0.5px;">${title}</h1>
              <p style="margin:0 0 32px;color:#a1a1aa;font-size:14px;line-height:1.6;">${subtitle}</p>

              <!-- OTP Box -->
              <div style="background:#09090b;border:1px solid #27272a;border-radius:12px;padding:28px;text-align:center;margin-bottom:32px;">
                <p style="margin:0 0 8px;color:#71717a;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;">Your verification code</p>
                <div style="color:#fafafa;font-size:40px;font-weight:800;letter-spacing:16px;font-variant-numeric:tabular-nums;padding:8px 0;">${otp}</div>
                <p style="margin:12px 0 0;color:#71717a;font-size:12px;">Expires in <strong style="color:#a1a1aa;">10 minutes</strong></p>
              </div>

              <p style="margin:0;color:#52525b;font-size:12px;line-height:1.6;">
                If you didn't request this, you can safely ignore this email. This code will expire automatically.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #27272a;">
              <p style="margin:0;color:#3f3f46;font-size:11px;">© ${new Date().getFullYear()} Onhandl. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendOtpEmail(
  to: string,
  otp: string,
  purpose: 'signup' | 'forgot_password'
): Promise<void> {
  const transport = createTransport();
  const subject =
    purpose === 'signup'
      ? 'Your Onhandl verification code'
      : 'Reset your Onhandl password';

  await transport.sendMail({
    from: `"Onhandl" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html: buildOtpHtml(otp, purpose),
  });
}

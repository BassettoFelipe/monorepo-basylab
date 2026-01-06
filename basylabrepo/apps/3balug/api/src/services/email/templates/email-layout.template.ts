interface EmailLayoutProps {
  content: string;
  previewText?: string;
}

export function emailLayout({ content, previewText }: EmailLayoutProps): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>3Balug</title>
  <style type="text/css">
    @media only screen and (max-width: 600px) {
      .content-wrapper { padding: 24px 20px !important; }
      .otp-code { font-size: 28px !important; letter-spacing: 6px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  ${previewText ? `<div style="display: none; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #f5f5f0;">${previewText}</div>` : ""}

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f0;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="padding: 24px 32px; background-color: #434D00;">
              <span style="color: #E6FF4B; font-size: 18px; font-weight: 700;">3Balug</span>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="content-wrapper" style="padding: 32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #fafaf7; border-top: 1px solid #e8e8e0;">
              <p style="margin: 0; color: #9da383; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} 3Balug
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

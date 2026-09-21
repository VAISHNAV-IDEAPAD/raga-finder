/**
 * Email templates for Raga Finder
 * Safe for both client-side and server-side usage (zero Node.js dependencies).
 */

/**
 * Generates the royal celebration HTML email template:
 * "Thank You For Joining Raga Finder Family"
 */
export function getWelcomeEmailHtml(userName: string, userContact: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You For Joining Raga Finder Family</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fcfbf9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1c1917;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #fcfbf9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; border: 1px solid #fde68a; box-shadow: 0 10px 25px -5px rgba(217, 119, 6, 0.1); overflow: hidden;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #d97706 0%, #ea580c 50%, #b45309 100%); padding: 40px 32px; text-align: center;">
              <div style="width: 64px; height: 64px; margin: 0 auto 16px; background-color: rgba(255, 255, 255, 0.2); border-radius: 20px; display: inline-flex; align-items: center; justify-content: center; line-height: 64px; font-size: 32px;">
                🎵
              </div>
              <p style="margin: 0; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #fef3c7;">
                OFFICIAL WELCOME CELEBRATION
              </p>
              <h1 style="margin: 12px 0 0; font-size: 26px; line-height: 1.25; font-weight: 900; color: #ffffff;">
                Thank You For Joining<br>Raga Finder Family
              </h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px;">
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #44403c;">
                Dear <strong style="color: #1c1917;">${userName}</strong>,
              </p>
              
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #57534e;">
                Welcome aboard! We are thrilled to welcome you to the <strong>Raga Finder Family</strong>. Your account (<code>${userContact}</code>) is now fully verified and activated.
              </p>

              <!-- Highlight Feature Box -->
              <table role="presentation" width="100%" style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 16px; padding: 20px; margin-bottom: 28px;">
                <tr>
                  <td>
                    <h3 style="margin: 0 0 10px; font-size: 14px; font-weight: 700; color: #92400e;">
                      ✨ What You Can Explore Right Now:
                    </h3>
                    <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.7; color: #78350f;">
                      <li><strong>72 Melakarta Ragas:</strong> Explore the definitive parent ragas with swara notations and audio structures.</li>
                      <li><strong>AI Musicologist:</strong> Identify unindexed Carnatic and Hindustani film and classical compositions with 1 click.</li>
                      <li><strong>Interactive Swara Keyboard:</strong> Press swaras (S, R, G, M, P, D, N) to discover matching classical scales.</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- Call To Action Button -->
              <table role="presentation" width="100%" style="text-align: center; margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="https://raga-finder-ideapad.vercel.app" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #d97706, #ea580c); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; border-radius: 14px; box-shadow: 0 4px 14px rgba(217, 119, 6, 0.3);">
                      Open Raga Finder Now →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #78716c; border-top: 1px solid #f5f5f4; padding-top: 20px;">
                If you did not sign up for Raga Finder, please disregard this email.<br>
                Happy Music Exploration!<br>
                <strong style="color: #44403c;">The Raga Finder Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #fafaf9; border-top: 1px solid #f5f5f4; padding: 20px 32px; text-align: center; font-size: 11px; color: #a8a29e;">
              Raga Finder &bull; Carnatic & Hindustani Musicology &bull; All Rights Reserved
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Plaintext version for fallback
 */
export function getWelcomeEmailText(userName: string, userContact: string): string {
  return `Thank You For Joining Raga Finder Family!

Dear ${userName},

Welcome to the Raga Finder Family! Your account (${userContact}) has been created and verified.

What you can explore on Raga Finder:
- 72 Melakarta Parent Ragas
- AI-Powered Song Raga Identification (Carnatic & Hindustani)
- Interactive Swara Keyboard & Scale Detection

Visit Raga Finder now:
https://raga-finder-ideapad.vercel.app

Happy Music Exploration!
The Raga Finder Team`;
}

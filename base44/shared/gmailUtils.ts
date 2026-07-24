export function toBase64Url(str: string): string {
  const b64 = btoa(unescape(encodeURIComponent(str)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function buildRawMime(
  fromName: string,
  fromEmail: string,
  toEmail: string,
  subject: string,
  html: string
): string {
  const boundary = 'ponto_eletronico_' + Date.now();
  const hasNonAscii = /[^\x00-\x7F]/.test(subject);
  const encodedSubject = hasNonAscii
    ? `=?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`
    : subject;
  const htmlB64 = btoa(unescape(encodeURIComponent(html)));

  const lines = [
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    `MIME-Version: 1.0`,
  ];
  if (fromEmail) {
    lines.push(`From: ${fromName ? `${fromName} ` : ''}<${fromEmail}>`);
  }
  lines.push(
    `To: ${toEmail}`,
    `Subject: ${encodedSubject}`,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    htmlB64,
    `--${boundary}--`,
    ``
  );

  return toBase64Url(lines.join('\r\n'));
}

export async function getGmailSenderEmail(
  accessToken: string
): Promise<string> {
  const profileRes = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/profile',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (profileRes.ok) {
    const profile = await profileRes.json();
    return profile.emailAddress || '';
  }
  return '';
}

export async function sendGmailEmail(
  accessToken: string,
  fromName: string,
  fromEmail: string,
  toEmail: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  const raw = buildRawMime(fromName, fromEmail, toEmail, subject, html);
  const sendRes = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    }
  );
  if (!sendRes.ok) {
    const errText = await sendRes.text();
    return { success: false, error: errText };
  }
  return { success: true };
}
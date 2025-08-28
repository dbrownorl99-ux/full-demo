import nodemailer from 'nodemailer';

export function buildTransport({ host, port, secure, user, pass }) {
  return nodemailer.createTransport({
    host,
    port: Number(port),
    secure: String(secure) === 'true',
    auth: { user, pass }
  });
}

export async function sendDocsEmail(transport, {
  to,
  from,
  subject,
  text,
  html,
  attachments = []
}) {
  return transport.sendMail({
    to,
    from,
    subject,
    text,
    html,
    attachments
  });
}

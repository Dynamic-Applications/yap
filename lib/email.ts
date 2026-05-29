// npm install resend
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInviteEmail({
    toEmail,
    senderName,
}: {
    toEmail: string;
    senderName: string;
}) {
    await resend.emails.send({
        from: "YourApp <no-reply@yourapp.com>",
        to: toEmail,
        subject: `${senderName} invited you to YourApp`,
        html: `
            <p>Hi there,</p>
            <p><strong>${senderName}</strong> wants to connect with you on YourApp.</p>
            <p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/signup?email=${encodeURIComponent(toEmail)}"
                   style="background:#3b82f6;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block;">
                    Accept Invite
                </a>
            </p>
            <p>Once you sign up, you'll automatically be connected.</p>
        `,
    });
}

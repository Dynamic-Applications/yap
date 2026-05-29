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
        from: `"Yap" <${process.env.RESEND_FROM_EMAIL}>`,
        // this is not working. have to use a verfied domain email address
        to: toEmail,
        subject: `${senderName} invited you to Yap`,
        html: `
            <p>Hi there,</p>
            <p><strong>${senderName}</strong> wants to connect with you on Yap.</p>
            <p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/auth/signup?email=${encodeURIComponent(toEmail)}"
                   style="background:#3b82f6;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block;">
                    Accept Invite
                </a>
            </p>
            <p>Once you sign up, you'll automatically be connected.</p>
        `,
    });
}

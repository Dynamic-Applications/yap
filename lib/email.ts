import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT),
    auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
    },
});

export async function sendVerificationEmail(
    email: string,
    name: string,
    token: string,
) {
    const verifyUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify?token=${token}`;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "Verify your Yap account",
        html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="font-size: 24px; margin-bottom: 8px;">Hey ${name} 👋</h2>
        <p style="color: #555;">Thanks for signing up for Yap. Click the button below to verify your email address.</p>
        <a href="${verifyUrl}"
           style="display: inline-block; margin: 24px 0; padding: 12px 28px;
                  background: #18181b; color: #fff; text-decoration: none;
                  border-radius: 8px; font-weight: 600;">
          Verify Email
        </a>
        <p style="color: #999; font-size: 13px;">
          This link expires in 24 hours. If you didn't sign up, you can safely ignore this email.
        </p>
      </div>
    `,
    });
}

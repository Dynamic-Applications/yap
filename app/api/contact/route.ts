import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
    const { name, email, message } = await request.json();

    if (!name || !email || !message) {
        return NextResponse.json(
            { error: "Name, email, and message are required" },
            { status: 400 },
        );
    }

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptionsToOwner = {
        from: `"MediaScan Contact" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
        subject: `New contact form submission from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\nMessage:\n${message}`,
    };

    const mailOptionsAutoReply = {
        from: `"MediaScan" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Thanks for contacting us, ${name}!`,
        text: `Hi ${name},\n\nThank you for reaching out! We'll get back to you soon.\n\nBest regards,\nMediaScan`,
    };

    try {
        await transporter.sendMail(mailOptionsToOwner);
        await transporter.sendMail(mailOptionsAutoReply);
        return NextResponse.json({ message: "Emails sent successfully." });
    } catch (error) {
        console.error("Error sending emails:", error);
        return NextResponse.json(
            { error: "Failed to send emails." },
            { status: 500 },
        );
    }
}

import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { to, subject, html } = await request.json();
    
    const data = await resend.emails.send({
      from: 'LaterDate <onboarding@resend.dev>',
      to: [to],
      subject: subject,
      html: html,
    });

    console.log('Email sent successfully:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to send email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function POST(request: NextRequest) {
  try {
    const { to, message } = await request.json();
    
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
    });

    console.log('SMS sent successfully:', result.sid);
    return NextResponse.json({ success: true, sid: result.sid });
  } catch (error) {
    console.error('Failed to send SMS:', error);
    return NextResponse.json({ error: 'Failed to send SMS' }, { status: 500 });
  }
} 
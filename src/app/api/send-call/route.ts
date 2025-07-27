import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

export async function POST(request: NextRequest) {
  try {
    const { to, title, message, category } = await request.json();

    if (!to || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: to, title' },
        { status: 400 }
      );
    }

    // Create TwiML for the voice message
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Amy">Reminder triggered. Name: ${title}. Message: ${message || 'No message'}. Category: ${category || 'No category'}. Have a productive day, Bye.</Say>
  <Hangup/>
</Response>`;

    const call = await client.calls.create({
      from: fromNumber,
      to: to,
      twiml: twiml,
    });

    console.log(`[CALL] Sent call for reminder "${title}" to ${to}. Twilio SID: ${call.sid}`);

    return NextResponse.json({ 
      success: true, 
      callSid: call.sid,
      message: 'Call initiated successfully' 
    });

  } catch (error) {
    console.error('[CALL] Error making call:', error);
    return NextResponse.json(
      { error: 'Failed to make call' },
      { status: 500 }
    );
  }
} 
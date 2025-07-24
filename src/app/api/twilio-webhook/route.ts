import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { twiml } from 'twilio';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const from = formData.get('From') as string;
  const body = (formData.get('Body') as string || '').trim().toLowerCase();

  let responseMsg = 'Sorry, I did not understand your message.';

  if (body === 'done') {
    // Find the most recent, incomplete reminder for this phone number
    const { data: reminders, error } = await supabase
      .from('user_reminders')
      .select('*')
      .eq('contact_phone', from)
      .eq('completed', false)
      .order('reminder_date', { ascending: false })
      .limit(1);
    if (!error && reminders && reminders.length > 0) {
      const reminder = reminders[0];
      await supabase
        .from('user_reminders')
        .update({ completed: true })
        .eq('id', reminder.id);
      responseMsg = 'Reminder marked as complete';
    } else {
      responseMsg = 'No incomplete reminders found for your number.';
    }
  }

  // Respond with TwiML
  const twimlResponse = new twiml.MessagingResponse();
  twimlResponse.message(responseMsg);
  return new Response(twimlResponse.toString(), {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  });
} 
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

console.log('Call script started');

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

function formatCallTwiml(reminder: any) {
  const title = reminder.title || 'No Title';
  const message = reminder.message || 'No message';
  const category = reminder.category || 'No category';
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Amy">Your reminder named ${title} with message of: ${message} under the category ${category} was triggered. Bye.</Say>
  <Hangup/>
</Response>`;
}

async function sendDueCalls() {
  const now = new Date();
  const nowIso = now.toISOString();
  console.log('[CALLS] Current UTC time:', nowIso);

  const { data: reminders, error } = await supabase
    .from('user_reminders')
    .select('*')
    .eq('completed', false)
    .eq('call_sent', false)
    .lte('reminder_date', nowIso);

  if (error) {
    console.error('[CALLS] Error fetching reminders:', error);
    return;
  }

  if (!reminders || reminders.length === 0) {
    console.log('[CALLS] No due reminders found.');
    return;
  }

  console.log(`[CALLS] Found ${reminders.length} due reminder(s):`, reminders.map(r => ({ id: r.id, reminder_date: r.reminder_date, contact_phone: r.contact_phone, contact_methods: r.contact_methods })));

  for (const reminder of reminders) {
    if (reminder.contact_methods && reminder.contact_phone && reminder.contact_methods.includes('voice')) {
      const twiml = formatCallTwiml(reminder);
      try {
        const result = await twilioClient.calls.create({
          to: reminder.contact_phone,
          from: process.env.TWILIO_PHONE_NUMBER,
          twiml: twiml,
        });
        console.log(`[CALL] Sent for reminder ${reminder.id} to ${reminder.contact_phone}. Twilio SID: ${result.sid}`);
        await supabase
          .from('user_reminders')
          .update({ call_sent: true })
          .eq('id', reminder.id);
      } catch (err) {
        console.error(`[CALL] Failed to send for reminder ${reminder.id}:`, err);
      }
    } else {
      console.log(`[CALLS] Reminder ${reminder.id} missing call requirements (contact_methods or contact_phone).`);
    }
  }
}

sendDueCalls(); 
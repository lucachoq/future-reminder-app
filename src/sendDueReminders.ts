import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

console.log('Script started');

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

function formatReminderMessage(reminder: any) {
  // Simple message format for now
  return `Reminder title: ${reminder.title || 'No Title'}\nMessage: ${reminder.message || ''}\nCategory: ${reminder.category || ''}\nFrequency: Once\nReply with "Done" to mark as complete`;
}

async function sendDueReminders() {
  const now = new Date();
  const nowIso = now.toISOString();
  console.log('[SMS] Current UTC time:', nowIso);

  // Fetch all reminders that are due
  const { data: reminders, error } = await supabase
    .from('user_reminders')
    .select('*')
    .eq('completed', false)
    .eq('sms_sent', false)
    .lte('reminder_date', nowIso);

  if (error) {
    console.error('[SMS] Error fetching reminders:', error);
    return;
  }

  if (!reminders || reminders.length === 0) {
    console.log('[SMS] No due reminders found.');
    return;
  }

  console.log(`[SMS] Found ${reminders.length} due reminder(s):`, reminders.map(r => ({ id: r.id, reminder_date: r.reminder_date, contact_phone: r.contact_phone })));

  for (const reminder of reminders) {
    if (reminder.contact_methods && reminder.contact_methods.includes('sms') && reminder.contact_phone) {
      const smsMessage = formatReminderMessage(reminder);
      try {
        const result = await twilioClient.messages.create({
          to: reminder.contact_phone,
          from: process.env.TWILIO_PHONE_NUMBER,
          body: smsMessage,
        });
        console.log(`[SMS] Sent for reminder ${reminder.id} to ${reminder.contact_phone}. Twilio SID: ${result.sid}`);
        // Mark as sent
        await supabase
          .from('user_reminders')
          .update({ sms_sent: true })
          .eq('id', reminder.id);
      } catch (err) {
        console.error(`[SMS] Failed to send for reminder ${reminder.id}:`, err);
      }
    } else {
      console.log(`[SMS] Reminder ${reminder.id} missing SMS requirements (contact_methods or contact_phone).`);
    }
  }
}

sendDueReminders();

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';
import { Resend } from 'resend';

console.log('Script started'); // Added for debugging

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

const resend = new Resend(process.env.RESEND_API_KEY);

function formatReminderMessage(reminder: Record<string, unknown>) {
  return `Reminder triggered:\nName - ${(reminder.title as string) || 'No Title'}\nMessage - ${(reminder.message as string) || ''}\nCategory - ${(reminder.category as string) || ''}`;
}

async function sendEmail(reminder: Record<string, unknown>) {
  const emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333;">🔔 Reminder: ${(reminder.title as string) || 'No Title'}</h2>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Message:</strong> ${(reminder.message as string) || 'No message'}</p>
        <p><strong>Category:</strong> ${(reminder.category as string) || 'No category'}</p>
        <p><strong>Date:</strong> ${new Date(reminder.reminder_date as string).toLocaleString()}</p>
      </div>
      <p style="color: #666; font-size: 14px;">This reminder was sent from LaterDate app.</p>
    </div>
  `;

  try {
    const data = await resend.emails.send({
      from: 'LaterDate <onboarding@resend.dev>',
      to: [reminder.contact_email as string],
      subject: `Reminder: ${(reminder.title as string) || 'No Title'}`,
      html: emailBody,
    });
    console.log(`[EMAIL] Sent for reminder ${reminder.id} to ${reminder.contact_email}. Resend ID: ${data.data?.id || 'unknown'}`);
    return true;
  } catch (error) {
    console.error(`[EMAIL] Failed to send for reminder ${reminder.id}:`, error);
    return false;
  }
}

async function sendDueReminders() {
  const now = new Date();
  const nowIso = now.toISOString();
  console.log('[REMINDERS] Current UTC time:', nowIso);

  // First, check if the required columns exist
  const { error: columnError } = await supabase
    .from('user_reminders')
    .select('sms_sent, email_sent')
    .limit(1);

  if (columnError && columnError.code === '42703') {
    console.error('[REMINDERS] Missing required columns. Please run this SQL in Supabase:');
    console.error('ALTER TABLE user_reminders ADD COLUMN IF NOT EXISTS sms_sent boolean DEFAULT false;');
    console.error('ALTER TABLE user_reminders ADD COLUMN IF NOT EXISTS email_sent boolean DEFAULT false;');
    console.error('UPDATE user_reminders SET sms_sent = false WHERE sms_sent IS NULL;');
    console.error('UPDATE user_reminders SET email_sent = false WHERE email_sent IS NULL;');
    return;
  }

  const { data: reminders, error } = await supabase
    .from('user_reminders')
    .select('*')
    .eq('completed', false)
    .lte('reminder_date', nowIso);

  if (error) {
    console.error('[REMINDERS] Error fetching reminders:', error);
    return;
  }

  if (!reminders || reminders.length === 0) {
    console.log('[REMINDERS] No due reminders found.');
    return;
  }

  // Filter out reminders that have already been sent by their contact method
  const unsentReminders = reminders.filter(reminder => {
    if (!reminder.contact_methods) return false;
    
    const methods = reminder.contact_methods;
    let needsSending = false;
    
    console.log(`[FILTER] Checking reminder ${reminder.id}:`, {
      contact_methods: methods,
      sms_sent: reminder.sms_sent,
      email_sent: reminder.email_sent
    });
    
    if (methods.includes('sms') && !reminder.sms_sent) {
      needsSending = true;
      console.log(`[FILTER] Reminder ${reminder.id} needs SMS sending`);
    }
    if (methods.includes('email') && !reminder.email_sent) {
      needsSending = true;
      console.log(`[FILTER] Reminder ${reminder.id} needs Email sending`);
    }
    
    if (!needsSending) {
      console.log(`[FILTER] Reminder ${reminder.id} already sent by all methods`);
    }
    
    return needsSending;
  });

  if (unsentReminders.length === 0) {
    console.log('[REMINDERS] No unsent reminders found.');
    return;
  }

  console.log(`[REMINDERS] Found ${unsentReminders.length} unsent reminder(s):`, unsentReminders.map(r => ({ 
    id: r.id, 
    title: r.title,
    reminder_date: r.reminder_date, 
    contact_phone: r.contact_phone, 
    contact_email: r.contact_email,
    contact_methods: r.contact_methods,
    sms_sent: r.sms_sent,
    email_sent: r.email_sent
  })));

  for (const reminder of unsentReminders) {
    console.log(`[DEBUG] Reminder ${reminder.id} contact_methods:`, reminder.contact_methods, 'type:', typeof reminder.contact_methods);
    
    if (!reminder.contact_methods) {
      console.log(`[REMINDERS] Reminder ${reminder.id} missing contact_methods.`);
      continue;
    }

    const methods = reminder.contact_methods;
    let smsSent = false;
    let emailSent = false;

    // Handle SMS
    if (methods.includes('sms') && reminder.contact_phone) {
      const smsMessage = formatReminderMessage(reminder);
      try {
        const result = await twilioClient.messages.create({
          to: reminder.contact_phone,
          from: process.env.TWILIO_PHONE_NUMBER,
          body: smsMessage,
        });
        console.log(`[SMS] Sent for reminder ${reminder.id} to ${reminder.contact_phone}. Twilio SID: ${result.sid}`);
        smsSent = true;
      } catch (err) {
        console.error(`[SMS] Failed to send for reminder ${reminder.id}:`, err);
      }
    }

    // Handle Email
    if (methods.includes('email') && reminder.contact_email) {
      console.log(`[EMAIL] Processing reminder ${reminder.id} with email ${reminder.contact_email}`);
      emailSent = await sendEmail(reminder);
    } else if (methods.includes('email') && !reminder.contact_email) {
      console.log(`[EMAIL] Reminder ${reminder.id} has email method but no contact_email`);
    } else if (!methods.includes('email')) {
      console.log(`[EMAIL] Reminder ${reminder.id} does not have email method`);
    }

    // Mark as sent if any method was successful
    if (smsSent || emailSent) {
      const updateData: Record<string, unknown> = {};
      if (smsSent) updateData.sms_sent = true;
      if (emailSent) updateData.email_sent = true;
      try {
        const { error: updateError, data: updateResult, status, statusText } = await supabase
          .from('user_reminders')
          .update(updateData)
          .eq('id', reminder.id)
          .select();
        if (updateError) {
          console.error(`[UPDATE] Failed to update reminder ${reminder.id}:`, updateError, status, statusText);
        } else {
          console.log(`[UPDATE] Successfully updated reminder ${reminder.id} with:`, updateData, 'Result:', updateResult);
        }
      } catch (err) {
        console.error(`[UPDATE] Exception updating reminder ${reminder.id}:`, err);
      }
    }
  }
}

sendDueReminders();

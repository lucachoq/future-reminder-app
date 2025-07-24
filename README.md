# Remind Me - Future Reminder App

A modern, feature-rich reminder application that helps you never miss important tasks again. Set reminders for the future and get notified via email, SMS, or phone calls.

## 🚀 Features

### Core Features
- **Flexible Scheduling**: Set reminders for specific dates or relative time periods (in X minutes/hours/days/weeks/months)
- **Multiple Contact Methods**: Get notified via email, SMS, or phone calls
- **Smart Persistence**: Configure how persistent your reminders should be - from one-time to continuous until completed
- **Category Organization**: Organize reminders by categories with smart emoji suggestions
- **Recurring Reminders**: Set up recurring reminders that repeat daily, weekly, or monthly until marked complete
- **Personalization**: Add custom messages and details to make your reminders more personal

### Use Cases
- Cancel free trials before they charge you
- Renew health cards, car registrations, and other important documents
- Return library books on time
- Send birthday messages to friends and family
- Manage subscription renewals
- Remember health appointments and checkups

### Business Model
- **Free Plan**: 2 free email reminders per month
- **Freemium**: $5-10/month for unlimited reminders
- **Lifetime**: One-time purchase option
- **Gift Service**: $1-3 per message for sending reminders to others

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Authentication**: Clerk
- **Database**: Supabase
- **Styling**: TailwindCSS + ShadCN UI
- **Animations**: Framer Motion
- **Emails**: Resend
- **SMS**: Twilio
- **Payments**: Stripe
- **Analytics**: PostHog
- **Deployment**: AWS Amplify

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Clerk account
- Resend account (for emails)
- Twilio account (for SMS)
- Stripe account (for payments)

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone <repository-url>
cd future-reminder-app
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env.local` file in the root directory:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Resend (Email)
RESEND_API_KEY=your_resend_api_key

# Twilio (SMS)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# PostHog Analytics
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Set up Supabase Database

Create the following tables in your Supabase database:

#### `reminders` table
```sql
CREATE TABLE reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
  category TEXT,
  contact_methods TEXT[] DEFAULT '{}',
  persistence TEXT DEFAULT 'once',
  repeat_settings JSONB,
  completed BOOLEAN DEFAULT FALSE,
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can view own reminders" ON reminders
  FOR ALL USING (auth.uid()::text = user_id);
```

#### `user_settings` table
```sql
CREATE TABLE user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  phone TEXT,
  default_reminder_time TIME DEFAULT '09:00:00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can view own settings" ON user_settings
  FOR ALL USING (auth.uid()::text = user_id);
```

### 5. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 📱 Features in Detail

### Landing Page
- Modern, responsive design with animations
- Clear value proposition and feature highlights
- Call-to-action buttons for sign up
- Trust indicators and use case examples

### Dashboard
- Overview statistics (upcoming, completed, overdue reminders)
- Tabbed interface (upcoming, completed, all reminders)
- Quick add reminder button
- Settings access

### Reminder Creation
- **Title & Message**: Add descriptive titles and detailed messages
- **Time Selection**: Choose specific date/time or relative time (in X days/weeks/months)
- **Categories**: Organize with smart emoji suggestions (health, business, personal, etc.)
- **Contact Methods**: Email, SMS, or phone calls
- **Persistence**: Configure how persistent reminders should be
- **Repeat Settings**: Daily, weekly, or monthly recurring reminders

### Reminder Management
- Edit existing reminders
- Mark as complete/incomplete
- Delete reminders
- View detailed information
- Color-coded status indicators

### Settings
- Default contact information
- Notification preferences
- Privacy and security information
- Billing and plan management

## 🎨 UI/UX Features

### Animations
- Smooth page transitions with Framer Motion
- Micro-animations for interactions
- Loading states and feedback
- Staggered animations for lists

### Design System
- Consistent color scheme and typography
- Responsive design for all devices
- Accessible components
- Modern, clean interface

### User Experience
- Intuitive navigation
- Clear visual hierarchy
- Helpful empty states
- Progressive disclosure of features

## 🔧 Development

### Project Structure
```
src/
├── app/                 # Next.js App Router pages
│   ├── dashboard/       # Dashboard page
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Landing page
├── components/          # Reusable components
│   ├── ReminderForm.tsx
│   ├── ReminderCard.tsx
│   └── SettingsModal.tsx
├── lib/                # Utility functions and configurations
│   ├── supabase.ts     # Supabase client and types
│   └── utils.ts        # Helper functions
└── middleware.ts       # Authentication middleware
```

### Key Components

#### ReminderForm
- Comprehensive form for creating/editing reminders
- Time selection (specific vs relative)
- Category selection with emojis
- Contact method configuration
- Persistence and repeat settings

#### ReminderCard
- Displays reminder information
- Status indicators (upcoming, overdue, completed)
- Action buttons (edit, delete, toggle complete)
- Contact method icons
- Responsive design

#### SettingsModal
- User profile settings
- Notification preferences
- Privacy and security information
- Billing and plan management

## 🚀 Deployment

### AWS Amplify
1. Connect your GitHub repository to AWS Amplify
2. Configure build settings:
   - Build command: `npm run build`
   - Output directory: `.next`
3. Set environment variables in Amplify console
4. Deploy

### Environment Variables for Production
Make sure to set all environment variables in your deployment platform:
- Clerk keys
- Supabase credentials
- Resend API key
- Twilio credentials
- Stripe keys
- PostHog configuration

## 🔮 Future Features

### Planned Enhancements
- **Mobile App**: React Native or Flutter app
- **Calendar Integration**: Sync with Google Calendar, Outlook
- **Smart Suggestions**: AI-powered reminder suggestions
- **Team Reminders**: Share reminders with team members
- **Advanced Analytics**: Detailed usage analytics
- **API Integration**: Webhook support for external services
- **Voice Reminders**: Voice-to-text reminder creation
- **Location-based**: Reminders based on location

### Business Features
- **White-label Solutions**: Custom branding for businesses
- **Enterprise Plans**: Advanced features for large organizations
- **API Access**: Developer API for integrations
- **Advanced Reporting**: Detailed analytics and insights

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:
1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed information
3. Contact support at support@remindme.com

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Clerk](https://clerk.com/) for authentication
- [Supabase](https://supabase.com/) for the database
- [TailwindCSS](https://tailwindcss.com/) for styling
- [Framer Motion](https://www.framer.com/motion/) for animations
- [Lucide](https://lucide.dev/) for icons

---

Made with ❤️ by the Remind Me team

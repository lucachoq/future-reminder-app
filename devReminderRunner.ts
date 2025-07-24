import 'dotenv/config';

setInterval(() => {
    import('./sendDueReminders');
}, 30000); // 30 seconds

// Run immediately on start
  import('./sendDueReminders');
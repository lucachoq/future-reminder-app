const { spawn } = require('child_process');

console.log('Email script started');

function runEmailScript() {
  const child = spawn('node', ['src/sendDueReminders.ts'], {
    stdio: 'inherit',
    shell: true
  });

  child.on('close', (code) => {
    console.log(`Email script exited with code ${code}`);
  });
}

// Run immediately
runEmailScript();

// Then run every 10 seconds
setInterval(runEmailScript, 10000); 
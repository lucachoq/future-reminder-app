const { exec } = require('child_process');
const path = require('path');

function runScript() {
  exec('npx ts-node sendDueReminders.ts', { cwd: __dirname }, (err, stdout, stderr) => {
    if (err) {
      console.error('Error running sendDueReminders.ts:', err);
    }
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
  });
}

setInterval(runScript, 10 * 1000); // Run every 10 seconds
runScript(); // Run immediately on startup 
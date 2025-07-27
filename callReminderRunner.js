const { exec } = require('child_process');

function runScript() {
  exec('node src/sendDueCalls.ts', (err, stdout, stderr) => {
    if (err) {
      console.error('Error running sendDueCalls.ts:', err);
    }
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
  });
}

setInterval(runScript, 10000); // Run every 10 seconds
runScript(); // Run immediately on start 
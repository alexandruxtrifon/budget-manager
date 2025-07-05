const cron = require('node-cron');
const { processNotifications, init } = require('./emailService');

(async function() {
  await init();
// Schedule email processing every 5 minutes
cron.schedule('*/10 * * * * *', async () => {
  //console.log('Running email notification processing...');
  try {
    await processNotifications();
  } catch (error) {
    console.error('Error in cron job:', error);
  }
});

console.log('Email notification cron job scheduled');
})();
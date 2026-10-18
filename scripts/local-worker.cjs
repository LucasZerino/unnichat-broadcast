// Executa o processamento nos emuladores locais; em produção, o agendamento usa o Cloud Scheduler.
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
process.env.GCLOUD_PROJECT = "demo-unnichat";
const { dispatchDueMessages } = require("../functions/lib/index.js");
async function tick() {
  try {
    await dispatchDueMessages();
  } catch (error) {
    console.error(error);
  }
  setTimeout(tick, 5000);
}
tick();

import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { setGlobalOptions } from "firebase-functions/v2";
import { commandSchema } from "./domain";
import { executeCommand } from "./mutations";
import { processDueMessages } from "./scheduler";

initializeApp();
setGlobalOptions({ region: "southamerica-east1", maxInstances: 5 });
const db = getFirestore();

export const mutate = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId)
    throw new HttpsError(
      "unauthenticated",
      "Entre na sua conta para continuar.",
    );
  const parsed = commandSchema.safeParse(request.data);
  if (!parsed.success)
    throw new HttpsError(
      "invalid-argument",
      parsed.error.issues[0]?.message ?? "Dados inválidos.",
    );
  return executeCommand(db, userId, parsed.data);
});

export async function dispatchDueMessages() {
  return processDueMessages(db);
}

export const dispatchScheduled = onSchedule(
  {
    schedule: "every 1 minutes",
    timeZone: "UTC",
    maxInstances: 1,
    retryCount: 3,
  },
  async () => {
    await dispatchDueMessages();
  },
);

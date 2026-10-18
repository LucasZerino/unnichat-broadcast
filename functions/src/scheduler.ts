import { type Firestore, Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { isDue } from "./domain";

export async function processDueMessages(db: Firestore) {
  const due = await db
    .collection("broadcasts")
    .where("status", "==", "scheduled")
    .where("scheduledAt", "<=", Timestamp.now())
    .limit(200)
    .get();
  let sent = 0;
  // A releitura na transação impede que execuções concorrentes, edições e exclusões processem dados desatualizados.
  for (const item of due.docs) {
    const dispatched = await db.runTransaction(async (tx) => {
      const current = await tx.get(item.ref);
      if (!current.exists) return false;
      const data = current.data()!;
      const now = Timestamp.now();
      if (
        !isDue(
          data.status,
          data.scheduledAt?.toMillis() ?? null,
          now.toMillis(),
        )
      )
        return false;
      const parent = await tx.get(
        db.collection("connections").doc(data.connectionId),
      );
      if (!parent.exists || parent.get("userId") !== data.userId) return false;
      tx.update(item.ref, { status: "sent", sentAt: now, updatedAt: now });
      return true;
    });
    if (dispatched) sent++;
  }
  logger.info("Broadcast simulation completed", { checked: due.size, sent });
  return sent;
}

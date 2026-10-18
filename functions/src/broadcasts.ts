import {
  type DocumentSnapshot,
  type Firestore,
  type Transaction,
  Timestamp,
} from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { type Command, validSchedule } from "./domain";

const MAX_BROADCASTS = 200;
type BroadcastCommand = Extract<
  Command,
  { action: "createBroadcast" | "updateBroadcast" | "deleteBroadcast" }
>;
type BroadcastContext = {
  db: Firestore;
  tx: Transaction;
  parentDoc: DocumentSnapshot;
  userId: string;
  now: Timestamp;
};

async function recipientSnapshots(
  { db, tx, parentDoc, userId }: BroadcastContext,
  contactIds: string[],
) {
  const contacts = await Promise.all(
    contactIds.map((id) => tx.get(db.collection("contacts").doc(id))),
  );
  if (
    contacts.some(
      (doc) =>
        !doc.exists ||
        doc.get("userId") !== userId ||
        doc.get("connectionId") !== parentDoc.id,
    )
  )
    throw new HttpsError(
      "invalid-argument",
      "Selecione contatos existentes desta conexão.",
    );
  return contacts.map((doc) => ({
    id: doc.id,
    name: doc.get("name"),
    phone: doc.get("phone"),
  }));
}

export async function mutateBroadcast(
  context: BroadcastContext,
  input: BroadcastCommand,
) {
  const { db, tx, parentDoc, userId, now } = context;
  const parent = parentDoc.ref;
  const ref =
    input.action === "createBroadcast"
      ? db.collection("broadcasts").doc()
      : db.collection("broadcasts").doc(input.broadcastId);
  const previous =
    input.action === "createBroadcast" ? null : await tx.get(ref);
  if (
    previous &&
    (!previous.exists ||
      previous.get("userId") !== userId ||
      previous.get("connectionId") !== parent.id)
  )
    throw new HttpsError("not-found", "Mensagem não encontrada.");

  if (input.action === "deleteBroadcast") {
    tx.delete(ref);
    tx.update(parent, {
      broadcastCount: parentDoc.get("broadcastCount") - 1,
      updatedAt: now,
    });
    return { id: ref.id };
  }
  if (!previous && parentDoc.get("broadcastCount") >= MAX_BROADCASTS)
    throw new HttpsError(
      "resource-exhausted",
      "Limite de 200 mensagens por conexão. Exclua mensagens antigas para continuar.",
    );
  // Os destinatários enviados compõem um histórico imutável, mesmo após excluir os contatos.
  if (previous?.get("status") === "sent") {
    tx.update(ref, { text: input.text, updatedAt: now });
    tx.update(parent, { updatedAt: now });
    return { id: ref.id };
  }
  const recipients = await recipientSnapshots(context, input.contactIds);
  if (!validSchedule(input.scheduledAt, now.toMillis()))
    throw new HttpsError(
      "invalid-argument",
      "Escolha um horário futuro, em até um ano.",
    );
  const status = input.scheduledAt === null ? "sent" : "scheduled";
  const data = {
    userId,
    connectionId: parent.id,
    text: input.text,
    recipients,
    status,
    scheduledAt:
      input.scheduledAt === null
        ? null
        : Timestamp.fromMillis(input.scheduledAt),
    sentAt: status === "sent" ? now : null,
    updatedAt: now,
  };
  if (previous) tx.update(ref, data);
  else tx.create(ref, { ...data, createdAt: now });
  tx.update(parent, {
    updatedAt: now,
    ...(!previous
      ? { broadcastCount: parentDoc.get("broadcastCount") + 1 }
      : {}),
  });
  return { id: ref.id };
}

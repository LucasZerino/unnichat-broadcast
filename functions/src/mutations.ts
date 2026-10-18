import {
  type DocumentSnapshot,
  type Firestore,
  type Transaction,
  Timestamp,
} from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import type { Command } from "./domain";
import { mutateBroadcast } from "./broadcasts";

const MAX_CONTACTS = 100;
type ContactCommand = Extract<
  Command,
  { action: "createContact" | "updateContact" | "deleteContact" }
>;

async function mutateContact(
  db: Firestore,
  tx: Transaction,
  parentDoc: DocumentSnapshot,
  userId: string,
  input: ContactCommand,
  now: Timestamp,
) {
  const parent = parentDoc.ref;
  if (input.action === "createContact") {
    if (parentDoc.get("contactCount") >= MAX_CONTACTS)
      throw new HttpsError(
        "resource-exhausted",
        "Limite de 100 contatos por conexão.",
      );
    const ref = db.collection("contacts").doc();
    tx.create(ref, {
      userId,
      connectionId: parent.id,
      name: input.name,
      phone: input.phone,
      createdAt: now,
      updatedAt: now,
    });
    tx.update(parent, {
      contactCount: parentDoc.get("contactCount") + 1,
      updatedAt: now,
    });
    return { id: ref.id };
  }

  const ref = db.collection("contacts").doc(input.contactId);
  const doc = await tx.get(ref);
  if (
    !doc.exists ||
    doc.get("userId") !== userId ||
    doc.get("connectionId") !== parent.id
  )
    throw new HttpsError("not-found", "Contato não encontrado.");
  if (input.action === "updateContact")
    tx.update(ref, { name: input.name, phone: input.phone, updatedAt: now });
  else tx.delete(ref);
  tx.update(parent, {
    updatedAt: now,
    ...(input.action === "deleteContact"
      ? { contactCount: parentDoc.get("contactCount") - 1 }
      : {}),
  });
  return { id: ref.id };
}

export async function executeCommand(
  db: Firestore,
  userId: string,
  input: Command,
) {
  if (input.action === "createConnection") {
    const ref = db.collection("connections").doc();
    const now = Timestamp.now();
    await ref.set({
      userId,
      name: input.name,
      contactCount: 0,
      broadcastCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    return { id: ref.id };
  }

  const parent = db.collection("connections").doc(input.connectionId);
  return db.runTransaction(async (tx) => {
    const parentDoc = await tx.get(parent);
    if (!parentDoc.exists || parentDoc.get("userId") !== userId)
      throw new HttpsError("not-found", "Conexão não encontrada.");
    const now = Timestamp.now();
    switch (input.action) {
      case "updateConnection":
        tx.update(parent, { name: input.name, updatedAt: now });
        return { id: parent.id };
      case "deleteConnection": {
        const children = (name: string) =>
          db
            .collection(name)
            .where("userId", "==", userId)
            .where("connectionId", "==", parent.id);
        const [contacts, broadcasts] = await Promise.all([
          tx.get(children("contacts")),
          tx.get(children("broadcasts")),
        ]);
        contacts.docs.forEach((doc) => tx.delete(doc.ref));
        broadcasts.docs.forEach((doc) => tx.delete(doc.ref));
        tx.delete(parent);
        return { id: parent.id };
      }
      case "createContact":
      case "updateContact":
      case "deleteContact":
        return mutateContact(db, tx, parentDoc, userId, input, now);
      default:
        // Toda alteração de contato ou mensagem também grava a conexão, serializando com a exclusão em cascata.
        return mutateBroadcast({ db, tx, parentDoc, userId, now }, input);
    }
  });
}

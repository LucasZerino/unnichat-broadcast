import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { initializeApp, deleteApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  deleteUser,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
  terminate,
} from "firebase/firestore";

// Exige confirmação explícita para criar e remover dados fictícios somente no projeto de avaliação.
if (!process.argv.includes("--run"))
  throw Error("Run with --run to exercise the deployed evaluation project.");
const config = JSON.parse(await readFile(".firebase-web-config.json", "utf8"));
assert.equal(config.projectId, "unnichat-lucas-20261017");
const accounts = [];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function client(label) {
  const app = initializeApp(config, label + randomUUID());
  const auth = getAuth(app),
    db = getFirestore(app);
  async function run(data) {
    // Segue o teste de contrato dos emuladores, enviando explicitamente o token de ID da sessão.
    const token = await auth.currentUser.getIdToken();
    const response = await fetch(
      `https://southamerica-east1-${config.projectId}.cloudfunctions.net/mutate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ data }),
      },
    );
    const body = await response.json();
    if (body.error) {
      const error = new Error(body.error.message);
      error.code =
        "functions/" + body.error.status.toLowerCase().replaceAll("_", "-");
      throw error;
    }
    assert.equal(response.status, 200);
    return body.result;
  }
  return { app, auth, db, run };
}
async function account() {
  const credentials = {
    email: `qa-${randomUUID()}@example.test`,
    password: randomUUID() + "Aa9!",
  };
  const c = client("qa");
  const record = { ...c, credentials, connectionId: null, closed: false };
  accounts.push(record);
  await createUserWithEmailAndPassword(
    c.auth,
    credentials.email,
    credentials.password,
  );
  return record;
}
async function close(c) {
  await terminate(c.db);
  await deleteApp(c.app);
  c.closed = true;
}
async function reopen(c) {
  Object.assign(c, client("reopen"), { closed: false });
  await signInWithEmailAndPassword(
    c.auth,
    c.credentials.email,
    c.credentials.password,
  );
}
try {
  const a = await account(),
    b = await account();
  console.log("PASS: deployed email/password registration.");
  const { id: connectionId } = await a.run({
    action: "createConnection",
    name: "Validação técnica temporária",
    userId: b.auth.currentUser.uid,
  });
  a.connectionId = connectionId;
  assert.equal(
    (await getDoc(doc(a.db, "connections", connectionId))).data().userId,
    a.auth.currentUser.uid,
  );
  await assert.rejects(() => getDoc(doc(b.db, "connections", connectionId)), {
    code: "permission-denied",
  });
  assert.equal(
    (
      await getDocs(
        query(
          collection(b.db, "connections"),
          where("userId", "==", b.auth.currentUser.uid),
        ),
      )
    ).size,
    0,
  );
  await assert.rejects(
    () =>
      b.run({ action: "updateConnection", connectionId, name: "Forbidden" }),
    { code: "functions/not-found" },
  );
  await assert.rejects(
    () => setDoc(doc(a.db, "connections", connectionId), { name: "Forbidden" }),
    { code: "permission-denied" },
  );
  console.log(
    "PASS: live tenant isolation, callable authorization and direct-write denial.",
  );
  await a.run({
    action: "updateConnection",
    connectionId,
    name: "Validação técnica — editada",
  });
  const { id: contactId } = await a.run({
    action: "createContact",
    connectionId,
    name: "Contato fictício",
    phone: "+55 (11) 99999-0000",
  });
  await a.run({
    action: "updateContact",
    connectionId,
    contactId,
    name: "Contato fictício editado",
    phone: "5511999990001",
  });
  assert.equal(
    (await getDoc(doc(a.db, "contacts", contactId))).data().phone,
    "5511999990001",
  );
  const { id: sentId } = await a.run({
    action: "createBroadcast",
    connectionId,
    text: "Simulação imediata de teste",
    contactIds: [contactId],
    scheduledAt: null,
  });
  const sent = (await getDoc(doc(a.db, "broadcasts", sentId))).data();
  assert.equal(sent.status, "sent");
  await a.run({
    action: "updateBroadcast",
    connectionId,
    broadcastId: sentId,
    text: "Histórico editado",
    contactIds: [contactId],
    scheduledAt: null,
  });
  assert.equal(
    (await getDoc(doc(a.db, "broadcasts", sentId))).data().sentAt.toMillis(),
    sent.sentAt.toMillis(),
  );
  console.log(
    "PASS: live connection/contact CRUD, immediate simulation and sent-history edit.",
  );
  const scheduledAt = Date.now() + 75000;
  const { id: scheduledId } = await a.run({
    action: "createBroadcast",
    connectionId,
    text: "Simulação agendada sem cliente aberto",
    contactIds: [contactId],
    scheduledAt,
  });
  assert.equal(
    (await getDoc(doc(a.db, "broadcasts", scheduledId))).data().status,
    "scheduled",
  );
  await close(a);
  await close(b);
  console.log(
    "Both clients closed. Waiting for the real Cloud Scheduler (no manual trigger).",
  );
  await sleep(Math.max(0, scheduledAt + 75000 - Date.now()));
  await reopen(a);
  let scheduled = (await getDoc(doc(a.db, "broadcasts", scheduledId))).data();
  const deadline = Date.now() + 90000;
  while (scheduled.status !== "sent" && Date.now() < deadline) {
    await sleep(15000);
    scheduled = (await getDoc(doc(a.db, "broadcasts", scheduledId))).data();
  }
  assert.equal(
    scheduled.status,
    "sent",
    "Real scheduler did not process the due message in time.",
  );
  assert.ok(scheduled.sentAt.toMillis() >= scheduledAt);
  console.log(
    "PASS: real Cloud Scheduler processed the message while both clients were closed.",
  );
  await a.run({ action: "deleteBroadcast", connectionId, broadcastId: sentId });
  await a.run({ action: "deleteContact", connectionId, contactId });
  await a.run({
    action: "updateBroadcast",
    connectionId,
    broadcastId: scheduledId,
    text: "Histórico corrigido após excluir o contato",
    contactIds: [contactId],
    scheduledAt: null,
  });
  const editedHistory = (
    await getDoc(doc(a.db, "broadcasts", scheduledId))
  ).data();
  assert.equal(
    editedHistory.text,
    "Histórico corrigido após excluir o contato",
  );
  assert.equal(editedHistory.sentAt.toMillis(), scheduled.sentAt.toMillis());
  assert.equal(editedHistory.scheduledAt.toMillis(), scheduledAt);
  assert.deepEqual(editedHistory.recipients, scheduled.recipients);
  console.log(
    "PASS: sent history remains editable after contact deletion, with immutable recipients/timestamps.",
  );
  assert.equal(
    (await getDoc(doc(a.db, "broadcasts", scheduledId))).data().recipients[0]
      .name,
    "Contato fictício editado",
  );
  await a.run({ action: "deleteConnection", connectionId });
  a.connectionId = null;
  for (const name of ["connections", "contacts", "broadcasts"]) {
    assert.equal(
      (
        await getDocs(
          query(
            collection(a.db, name),
            where("userId", "==", a.auth.currentUser.uid),
          ),
        )
      ).size,
      0,
    );
  }
  console.log(
    "PASS: live deletion/cascade and recipient snapshot; all fixture documents removed.",
  );
} finally {
  for (const c of accounts) {
    try {
      if (c.closed) await reopen(c);
      if (c.connectionId)
        await c.run({
          action: "deleteConnection",
          connectionId: c.connectionId,
        });
      if (c.auth.currentUser) await deleteUser(c.auth.currentUser);
      await close(c);
    } catch (error) {
      console.error("Fixture cleanup failed:", error.code ?? error.message);
      process.exitCode = 1;
    }
  }
}

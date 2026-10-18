import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { initializeApp, deleteApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
} from "firebase/firestore";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
if (
  !process.env.FIRESTORE_EMULATOR_HOST ||
  !process.env.FIREBASE_AUTH_EMULATOR_HOST
)
  throw Error("Use firebase emulators:exec.");
process.env.GCLOUD_PROJECT = "demo-unnichat";
const env = await initializeTestEnvironment({
  projectId: "demo-unnichat",
  firestore: { rules: await readFile("firestore.rules", "utf8") },
});
const apps = [];
async function isAbsent(name, id) {
  let absent = false;
  await env.withSecurityRulesDisabled(async (context) => {
    absent = !(await getDoc(doc(context.firestore(), name, id))).exists();
  });
  return absent;
}
async function account(label) {
  const app = initializeApp(
    { projectId: "demo-unnichat", apiKey: "demo-key" },
    label + Date.now(),
  );
  apps.push(app);
  const auth = getAuth(app);
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  const { user } = await createUserWithEmailAndPassword(
    auth,
    label + Date.now() + "@example.test",
    "Test12345!",
  );
  const db = getFirestore(app);
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  return { app, db, uid: user.uid, token: await user.getIdToken() };
}
async function run(token, data, error) {
  const res = await fetch(
    "http://127.0.0.1:5001/demo-unnichat/southamerica-east1/mutate",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: "Bearer " + token } : {}),
      },
      body: JSON.stringify({ data }),
    },
  );
  const body = await res.json();
  if (error) {
    assert.equal(body.error?.status, error, JSON.stringify(body));
    return;
  }
  assert.equal(res.status, 200, JSON.stringify(body));
  return body.result;
}
try {
  await env.clearFirestore();
  const a = await account("alice"),
    b = await account("bob");
  await run(
    null,
    { action: "createConnection", name: "No" },
    "UNAUTHENTICATED",
  );
  const { id: c } = await run(a.token, {
    action: "createConnection",
    name: "Canal",
    userId: b.uid,
  });
  assert.equal(
    (await getDoc(doc(a.db, "connections", c))).data().userId,
    a.uid,
  );
  await run(a.token, {
    action: "updateConnection",
    connectionId: c,
    name: "Canal atualizado",
  });
  assert.equal(
    (await getDoc(doc(a.db, "connections", c))).data().name,
    "Canal atualizado",
  );
  await assertFails(getDoc(doc(b.db, "connections", c)));
  await assertFails(getDocs(collection(b.db, "connections")));
  await assertSucceeds(
    getDocs(
      query(collection(b.db, "connections"), where("userId", "==", b.uid)),
    ),
  );
  await assertFails(setDoc(doc(a.db, "connections", c), { userId: b.uid }));
  await run(
    b.token,
    { action: "deleteConnection", connectionId: c },
    "NOT_FOUND",
  );
  console.log("PASS authentication, connection CRUD and tenant isolation");
  const { id: p } = await run(a.token, {
    action: "createContact",
    connectionId: c,
    name: "Ana",
    phone: "+55 (84) 99999-0000",
  });
  await run(a.token, {
    action: "updateContact",
    connectionId: c,
    contactId: p,
    name: "Ana Silva",
    phone: "84999990000",
  });
  assert.equal(
    (await getDoc(doc(a.db, "contacts", p))).data().name,
    "Ana Silva",
  );
  await assertFails(getDoc(doc(b.db, "contacts", p)));
  await run(
    a.token,
    { action: "createContact", connectionId: c, name: "Ana", phone: "invalid" },
    "INVALID_ARGUMENT",
  );
  const data = { connectionId: c, text: "Mensagem simulada", contactIds: [p] };
  const { id: instant } = await run(a.token, {
    action: "createBroadcast",
    ...data,
    scheduledAt: null,
  });
  const original = (await getDoc(doc(a.db, "broadcasts", instant))).data();
  assert.equal(original.status, "sent");
  assert.ok(original.sentAt);
  await run(a.token, {
    action: "updateBroadcast",
    ...data,
    broadcastId: instant,
    text: "Editada",
    scheduledAt: null,
  });
  const edited = (await getDoc(doc(a.db, "broadcasts", instant))).data();
  assert.equal(edited.text, "Editada");
  assert.equal(edited.sentAt.toMillis(), original.sentAt.toMillis());
  await assertFails(getDoc(doc(b.db, "broadcasts", instant)));
  await run(
    b.token,
    { action: "deleteBroadcast", connectionId: c, broadcastId: instant },
    "NOT_FOUND",
  );
  await run(
    a.token,
    { action: "createBroadcast", ...data, contactIds: [], scheduledAt: null },
    "INVALID_ARGUMENT",
  );
  await run(
    a.token,
    { action: "createBroadcast", ...data, scheduledAt: Date.now() - 1 },
    "INVALID_ARGUMENT",
  );
  const { id: bc } = await run(b.token, {
    action: "createConnection",
    name: "Outro cliente",
  });
  const { id: bp } = await run(b.token, {
    action: "createContact",
    connectionId: bc,
    name: "Bia",
    phone: "11999990000",
  });
  await run(
    a.token,
    { action: "createBroadcast", ...data, contactIds: [bp], scheduledAt: null },
    "INVALID_ARGUMENT",
  );
  await run(
    b.token,
    {
      action: "updateContact",
      connectionId: c,
      contactId: p,
      name: "Invasão",
      phone: "11999990000",
    },
    "NOT_FOUND",
  );
  console.log(
    "PASS contact CRUD, immediate simulation, history edit and validation",
  );
  const dueAt = Date.now() + 30000;
  const { id: due } = await run(a.token, {
    action: "createBroadcast",
    ...data,
    scheduledAt: dueAt,
  });
  const { id: future } = await run(a.token, {
    action: "createBroadcast",
    ...data,
    scheduledAt: Date.now() + 3600000,
  });
  await run(a.token, {
    action: "updateBroadcast",
    ...data,
    broadcastId: future,
    text: "Agendamento editado",
    scheduledAt: Date.now() + 7200000,
  });
  assert.equal(
    (await getDoc(doc(a.db, "broadcasts", future))).data().text,
    "Agendamento editado",
  );
  const { id: removed } = await run(a.token, {
    action: "createBroadcast",
    ...data,
    scheduledAt: Date.now() + 3600000,
  });
  await run(a.token, {
    action: "deleteBroadcast",
    connectionId: c,
    broadcastId: removed,
  });
  await deleteApp(a.app);
  apps.splice(apps.indexOf(a.app), 1);
  await new Promise((r) =>
    setTimeout(r, Math.max(0, dueAt - Date.now() + 100)),
  );
  const { dispatchDueMessages } = await import("../functions/lib/index.js");
  const counts = await Promise.all([
    dispatchDueMessages(),
    dispatchDueMessages(),
  ]);
  assert.equal(
    counts.reduce((x, y) => x + y, 0),
    1,
  );
  const verify = env.authenticatedContext(a.uid).firestore();
  assert.equal(
    (await getDoc(doc(verify, "broadcasts", due))).data().status,
    "sent",
  );
  assert.equal(
    (await getDoc(doc(verify, "broadcasts", future))).data().status,
    "scheduled",
  );
  assert.equal(await isAbsent("broadcasts", removed), true);
  assert.equal(await dispatchDueMessages(), 0);
  console.log(
    "PASS server scheduling with client closed, concurrency and idempotency",
  );
  await run(a.token, {
    action: "deleteContact",
    connectionId: c,
    contactId: p,
  });
  assert.equal(await isAbsent("contacts", p), true);
  assert.equal(
    (await getDoc(doc(verify, "broadcasts", due))).data().recipients[0].name,
    "Ana Silva",
  );
  const sentHistory = (await getDoc(doc(verify, "broadcasts", due))).data();
  for (const contactId of [p, bp]) {
    await run(
      a.token,
      {
        action: "updateBroadcast",
        connectionId: c,
        broadcastId: future,
        contactIds: [contactId],
        text: "Agendamento ainda valida contatos atuais",
        scheduledAt: Date.now() + 3600000,
      },
      "INVALID_ARGUMENT",
    );
  }
  const { id: replacement } = await run(a.token, {
    action: "createContact",
    connectionId: c,
    name: "Novo destinatário",
    phone: "11988880000",
  });
  for (const [contactIds, text, scheduledAt] of [
    [[p], "Texto corrigido após excluir o contato", null],
    [
      [replacement, bp, "missing-contact"],
      "Histórico imutável",
      Date.now() + 3600000,
    ],
  ]) {
    await run(a.token, {
      action: "updateBroadcast",
      connectionId: c,
      broadcastId: due,
      contactIds,
      text,
      scheduledAt,
    });
    const after = (await getDoc(doc(verify, "broadcasts", due))).data();
    assert.equal(after.text, text);
    assert.equal(after.status, "sent");
    assert.deepEqual(after.recipients, sentHistory.recipients);
    assert.equal(after.sentAt.toMillis(), sentHistory.sentAt.toMillis());
    assert.equal(
      after.scheduledAt.toMillis(),
      sentHistory.scheduledAt.toMillis(),
    );
    assert.equal(await dispatchDueMessages(), 0);
  }
  console.log(
    "PASS sent history edits after contact deletion and immutable recipients",
  );
  await run(a.token, { action: "deleteConnection", connectionId: c });
  assert.equal(await isAbsent("connections", c), true);
  assert.equal(await isAbsent("contacts", replacement), true);
  assert.equal(
    (
      await getDocs(
        query(collection(verify, "broadcasts"), where("userId", "==", a.uid)),
      )
    ).size,
    0,
  );
  console.log("PASS contact history and atomic connection cascade");
} finally {
  await Promise.all(apps.map(deleteApp));
  await env.cleanup();
  const { getApps, deleteApp: remove } = await import("firebase-admin/app");
  await Promise.all(getApps().map(remove));
}

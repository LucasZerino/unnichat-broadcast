import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import {
  getFunctions,
  connectFunctionsEmulator,
  httpsCallable,
} from "firebase/functions";
const env = import.meta.env;
export const emulatorMode =
  env.VITE_USE_EMULATORS === "true" ||
  (env.DEV && !env.VITE_FIREBASE_PROJECT_ID);
export const configured =
  emulatorMode ||
  Boolean(
    env.VITE_FIREBASE_PROJECT_ID &&
    env.VITE_FIREBASE_API_KEY &&
    env.VITE_FIREBASE_APP_ID,
  );
const app = initializeApp({
  projectId: env.VITE_FIREBASE_PROJECT_ID || "demo-unnichat",
  apiKey: env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "demo-unnichat.firebaseapp.com",
  appId: env.VITE_FIREBASE_APP_ID || "demo-app-id",
});
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, "southamerica-east1");
if (emulatorMode) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
}
export const mutate = httpsCallable<Record<string, unknown>, { id: string }>(
  functions,
  "mutate",
);

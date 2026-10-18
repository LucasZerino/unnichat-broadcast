import type { Timestamp } from "firebase/firestore";
export type Connection = {
  id: string;
  userId: string;
  name: string;
  contactCount: number;
  broadcastCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
export type Contact = {
  id: string;
  userId: string;
  connectionId: string;
  name: string;
  phone: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
export type Recipient = { id: string; name: string; phone: string };
export type Broadcast = {
  id: string;
  userId: string;
  connectionId: string;
  text: string;
  recipients: Recipient[];
  status: "sent" | "scheduled";
  scheduledAt: Timestamp | null;
  sentAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

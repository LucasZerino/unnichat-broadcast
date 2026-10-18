import { test } from "node:test";
import assert from "node:assert/strict";
import { commandSchema, isDue, validSchedule } from "./domain";

test("dispatch only scheduled messages at or after their due time", () => {
  assert.equal(isDue("scheduled", 1000, 999), false);
  assert.equal(isDue("scheduled", 1000, 1000), true);
  assert.equal(isDue("sent", 1000, 2000), false);
  assert.equal(isDue("scheduled", null, 2000), false);
});
test("validate schedules against server time", () => {
  assert.equal(validSchedule(null, 1000), true);
  assert.equal(validSchedule(1000, 1000), false);
  assert.equal(validSchedule(1001, 1000), true);
  assert.equal(validSchedule(1000 + 367 * 86400000, 1000), false);
});
test("reject malformed commands and normalize phones", () => {
  assert.equal(
    commandSchema.safeParse({
      action: "deleteConnection",
      connectionId: "../other",
    }).success,
    false,
  );
  assert.equal(
    commandSchema.safeParse({ action: "createConnection", name: "  " }).success,
    false,
  );
  assert.equal(
    commandSchema.safeParse({
      action: "createBroadcast",
      connectionId: "a",
      text: "hello",
      contactIds: ["x", "x"],
      scheduledAt: null,
    }).success,
    false,
  );
  const contact = commandSchema.parse({
    action: "createContact",
    connectionId: "a",
    name: " Ana ",
    phone: "+55 (84) 99999-0000",
  });
  assert.equal(
    contact.action === "createContact" && contact.phone,
    "5584999990000",
  );
});

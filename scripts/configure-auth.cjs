// Configura a autenticação com o login existente da CLI oficial do Firebase, sem exportar tokens.
const {
  selectAccount,
  setActiveAccount,
} = require("firebase-tools/lib/auth");
const { requireAuth } = require("firebase-tools/lib/requireAuth");
const { Client } = require("firebase-tools/lib/apiv2");
(async () => {
  const options = { project: "unnichat-lucas-20261017", nonInteractive: true };
  const account = selectAccount("lucasmzerino@gmail.com", process.cwd());
  if (!account) throw Error("Run firebase login first.");
  setActiveAccount(options, account);
  await requireAuth(options);
  const client = new Client({
    urlPrefix: "https://identitytoolkit.googleapis.com",
    apiVersion: "admin/v2",
  });
  const name = "projects/unnichat-lucas-20261017/config";
  let body; try { ({ body } = await client.get(name)); } catch (error) { if (!error.message.includes("CONFIGURATION_NOT_FOUND")) throw error; body = {}; }
  if (!body.signIn?.email?.enabled || !body.signIn?.email?.passwordRequired) {
    await client.patch(
      name,
      { name, signIn: { email: { enabled: true, passwordRequired: true } } },
      {
        queryParams: {
          updateMask: "signIn.email.enabled,signIn.email.passwordRequired",
        },
      },
    );
    ({ body } = await client.get(name));
  }
  console.log(
    JSON.stringify({
      project: "unnichat-lucas-20261017",
      emailEnabled: body.signIn?.email?.enabled,
      passwordRequired: body.signIn?.email?.passwordRequired,
      authorizedDomains: body.authorizedDomains,
    }),
  );
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});



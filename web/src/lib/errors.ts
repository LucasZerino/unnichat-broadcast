export function errorMessage(error: unknown) {
  const code = (error as { code?: string })?.code || "";
  if (
    code.includes("invalid-credential") ||
    code.includes("wrong-password") ||
    code.includes("user-not-found")
  )
    return "E-mail ou senha incorretos.";
  if (code.includes("email-already-in-use"))
    return "Este e-mail já tem uma conta. Entre com sua senha.";
  if (code.includes("weak-password"))
    return "Use uma senha com pelo menos 6 caracteres.";
  if (code.includes("too-many-requests"))
    return "Muitas tentativas. Aguarde alguns instantes antes de tentar novamente.";
  if (code.includes("network") || code.includes("unavailable"))
    return "Não foi possível conectar. Verifique sua internet e tente novamente.";
  if (code.includes("unauthenticated"))
    return "Sua sessão expirou. Entre novamente.";
  if (
    code.includes("invalid-argument") ||
    code.includes("resource-exhausted") ||
    code.includes("not-found")
  )
    return (error as Error).message.replace("Firebase: ", "");
  return "Não foi possível concluir a ação. Tente novamente.";
}

import { useState, type FormEvent } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  Alert,
  Avatar,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
import ArrowForward from "@mui/icons-material/ArrowForward";
import CheckCircleOutline from "@mui/icons-material/CheckCircleOutline";
import Schedule from "@mui/icons-material/Schedule";
import { auth, configured } from "../../firebase";
import { errorMessage } from "../../lib/errors";
import { Brand } from "../../components/Brand";
export function AuthScreen() {
  const [register, setRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await (register
        ? createUserWithEmailAndPassword(auth, email.trim(), password)
        : signInWithEmailAndPassword(auth, email.trim(), password));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-shell">
      <section className="auth-story">
        <Brand />
        <div>
          <h1>Uma conversa começa com organização.</h1>
          <p className="muted text-lg leading-7 max-w-md">
            Conexões, contatos e mensagens. Tudo no lugar para preparar seu
            próximo envio.
          </p>
          <div className="auth-preview">
            <div className="flex items-center gap-3">
              <Avatar sx={{ bgcolor: "#eaf4f0", color: "#007c74" }}>
                <CheckCircleOutline />
              </Avatar>
              <div>
                <strong>Mais clareza em cada envio</strong>
                <p className="muted text-sm m-0 mt-1">
                  Planeje agora. Acompanhe quando precisar.
                </p>
              </div>
            </div>
            <div className="mt-6 border-t border-slate-100 pt-5 flex items-center justify-between gap-3">
              <span className="text-sm muted">Envio imediato ou agendado</span>
              <Schedule sx={{ color: "#6953a1" }} />
            </div>
          </div>
        </div>
        <footer className="text-sm muted">
          Ambiente de avaliação · envios simulados
        </footer>
      </section>
      <section className="auth-form">
        <form onSubmit={submit} className="w-full max-w-sm flex flex-col gap-5">
          <div>
            <Typography variant="h4">
              {register ? "Crie sua conta" : "Que bom ter você aqui"}
            </Typography>
            <p className="muted text-sm mt-3">
              {register
                ? "Seu espaço para organizar conexões e mensagens."
                : "Entre para acessar sua central de mensagens."}
            </p>
          </div>
          {!configured && (
            <Alert severity="warning">
              A aplicação ainda precisa ser configurada pelo responsável pelo
              projeto.
            </Alert>
          )}
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            fullWidth
            label="E-mail"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
          />
          <TextField
            fullWidth
            label="Senha"
            type="password"
            autoComplete={register ? "new-password" : "current-password"}
            required
            inputProps={{ minLength: 6 }}
            helperText={register ? "Pelo menos 6 caracteres." : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
          />
          <Button
            type="submit"
            size="large"
            variant="contained"
            disabled={busy || !configured}
            endIcon={busy ? <CircularProgress size={18} /> : <ArrowForward />}
          >
            {busy ? "Aguarde…" : register ? "Criar conta" : "Entrar"}
          </Button>
          <div className="text-center text-sm">
            <span className="muted">
              {register ? "Já tem uma conta?" : "Ainda não tem conta?"}
            </span>{" "}
            <Button
              disabled={busy}
              onClick={() => {
                setRegister(!register);
                setError("");
              }}
            >
              {register ? "Entrar" : "Criar conta"}
            </Button>
          </div>
          <p className="muted text-xs leading-5 text-center">
            As mensagens deste ambiente são simuladas. Nenhum contato receberá
            um envio real.
          </p>
        </form>
      </section>
    </div>
  );
}

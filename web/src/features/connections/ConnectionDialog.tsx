import { useState, type FormEvent } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { mutate } from "../../firebase";
import { errorMessage } from "../../lib/errors";
import type { Connection } from "../../types";

type Props = {
  connection: Connection | null;
  onClose: () => void;
  onSaved: (id: string) => void;
  notify: (message: string) => void;
};

export function ConnectionDialog({
  connection,
  onClose,
  onSaved,
  notify,
}: Props) {
  const [name, setName] = useState(connection?.name || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await mutate({
        action: connection ? "updateConnection" : "createConnection",
        name,
        ...(connection ? { connectionId: connection.id } : {}),
      });
      notify(connection ? "Conexão atualizada." : "Conexão criada.");
      onSaved(result.data.id);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onClose={() => !busy && onClose()}>
      <form onSubmit={save}>
        <DialogTitle>
          {connection ? "Editar conexão" : "Nova conexão"}
        </DialogTitle>
        <DialogContent>
          <p className="muted text-sm mb-5">
            Use um nome que ajude a identificar esta lista de contatos.
          </p>
          {error && (
            <Alert severity="error" className="mb-4">
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            fullWidth
            label="Nome da conexão"
            required
            inputProps={{ maxLength: 100 }}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={busy}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={busy || !name.trim()}
          >
            {busy ? "Salvando…" : "Salvar conexão"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

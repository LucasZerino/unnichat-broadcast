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
import type { Contact } from "../../types";

type ContactDialogProps = {
  contact: Contact | null;
  connectionId: string;
  onClose: () => void;
  notify: (message: string) => void;
};

export function ContactDialog({
  contact,
  connectionId,
  onClose,
  notify,
}: ContactDialogProps) {
  const [name, setName] = useState(contact?.name || "");
  const [phone, setPhone] = useState(contact?.phone || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await mutate({
        action: contact ? "updateContact" : "createContact",
        connectionId,
        name,
        phone,
        ...(contact ? { contactId: contact.id } : {}),
      });
      notify(contact ? "Contato atualizado." : "Contato adicionado.");
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onClose={() => !busy && onClose()}>
      <form onSubmit={save}>
        <DialogTitle>{contact ? "Editar contato" : "Novo contato"}</DialogTitle>
        <DialogContent>
          <div className="flex flex-col gap-5 pt-2">
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              autoFocus
              required
              label="Nome"
              value={name}
              disabled={busy}
              inputProps={{ maxLength: 100 }}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              required
              label="Telefone com DDD"
              type="tel"
              value={phone}
              disabled={busy}
              inputProps={{ maxLength: 25 }}
              onChange={(e) => setPhone(e.target.value)}
              helperText="Informe DDD e número. O código do país é opcional."
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button disabled={busy} onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={busy || !name.trim() || !phone.trim()}
            variant="contained"
            type="submit"
          >
            {busy ? "Salvando…" : "Salvar contato"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

import { useState, type FormEvent } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import Schedule from "@mui/icons-material/Schedule";
import SendOutlined from "@mui/icons-material/SendOutlined";
import { mutate } from "../../firebase";
import { dateInput } from "../../lib/dates";
import { errorMessage } from "../../lib/errors";
import type { Broadcast, Contact } from "../../types";
import { RecipientPicker } from "./RecipientPicker";

type MessageDialogProps = {
  message: Broadcast | null;
  contacts: Contact[];
  connectionId: string;
  onClose: () => void;
  notify: (message: string) => void;
};

export function MessageDialog({
  message,
  contacts,
  connectionId,
  onClose,
  notify,
}: MessageDialogProps) {
  const sent = message?.status === "sent";
  const [text, setText] = useState(message?.text || "");
  const [ids, setIds] = useState(
    message?.recipients
      .filter(
        (recipient) =>
          sent || contacts.some((person) => person.id === recipient.id),
      )
      .map((person) => person.id) || [],
  );
  const [mode, setMode] = useState(
    message?.status === "scheduled" ? "scheduled" : "now",
  );
  const [time, setTime] = useState(
    dateInput(message?.scheduledAt?.toMillis() || Date.now() + 300000),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const selectedIds = sent
    ? ids
    : ids.filter((id) => contacts.some((person) => person.id === id));

  async function save(event: FormEvent) {
    event.preventDefault();
    const schedule = mode === "scheduled" ? new Date(time).getTime() : null;
    if (
      !sent &&
      schedule !== null &&
      (!Number.isFinite(schedule) || schedule <= Date.now())
    ) {
      setError("Escolha uma data e horário no futuro.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await mutate({
        action: message ? "updateBroadcast" : "createBroadcast",
        connectionId,
        text,
        contactIds:
          message?.status === "sent"
            ? message.recipients.map((person) => person.id)
            : selectedIds,
        scheduledAt: schedule,
        ...(message ? { broadcastId: message.id } : {}),
      });
      notify(
        message
          ? "Mensagem atualizada."
          : mode === "scheduled"
            ? "Mensagem agendada."
            : "Envio simulado concluído.",
      );
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
        <DialogTitle>
          {message ? "Editar mensagem" : "Nova mensagem"}
        </DialogTitle>
        <DialogContent>
          <div className="flex flex-col gap-5 pt-2">
            {error && <Alert severity="error">{error}</Alert>}
            {sent && (
              <Alert severity="info">
                Esta mensagem já foi enviada. A edição atualiza o registro, sem
                realizar outro envio.
              </Alert>
            )}
            {message?.status === "sent" ? (
              <div>
                <Typography variant="subtitle2">Destinatários</Typography>
                <div className="border border-slate-200 rounded-lg max-h-44 overflow-y-auto px-2">
                  {message.recipients.map((person) => (
                    <div
                      key={person.id}
                      className="flex flex-wrap gap-x-3 text-sm py-2"
                    >
                      <span>{person.name}</span>
                      <span className="muted">{person.phone}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs muted mt-1">
                  {message.recipients.length} destinatário(s)
                </p>
              </div>
            ) : (
              <RecipientPicker
                contacts={contacts}
                selectedIds={selectedIds}
                disabled={busy}
                onChange={setIds}
              />
            )}
            <TextField
              required
              autoFocus
              label="Mensagem"
              multiline
              minRows={4}
              inputProps={{ maxLength: 4000 }}
              value={text}
              disabled={busy}
              onChange={(e) => setText(e.target.value)}
              helperText={text.length + " / 4.000 caracteres"}
            />
            {!sent && (
              <>
                <Select
                  value={mode}
                  disabled={busy}
                  onChange={(e) => setMode(e.target.value)}
                  inputProps={{ "aria-label": "Quando enviar" }}
                >
                  <MenuItem value="now">Enviar agora</MenuItem>
                  <MenuItem value="scheduled">Agendar envio</MenuItem>
                </Select>
                {mode === "scheduled" && (
                  <TextField
                    required
                    label="Data e horário"
                    type="datetime-local"
                    value={time}
                    disabled={busy}
                    onChange={(e) => setTime(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    helperText={
                      "Horário local: " +
                      Intl.DateTimeFormat().resolvedOptions().timeZone +
                      ". O processamento pode levar até um minuto após o horário escolhido."
                    }
                  />
                )}
              </>
            )}
            <p className="text-xs muted m-0">
              Este é um envio simulado. Nenhuma mensagem será entregue ao
              telefone dos contatos.
            </p>
          </div>
        </DialogContent>
        <DialogActions>
          <Button disabled={busy} onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={busy || (!sent && !selectedIds.length) || !text.trim()}
            type="submit"
            variant="contained"
            startIcon={
              busy ? (
                <CircularProgress size={16} />
              ) : mode === "scheduled" ? (
                <Schedule />
              ) : (
                <SendOutlined />
              )
            }
          >
            {busy
              ? "Salvando…"
              : message
                ? "Salvar alterações"
                : mode === "scheduled"
                  ? "Agendar mensagem"
                  : "Enviar mensagem"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

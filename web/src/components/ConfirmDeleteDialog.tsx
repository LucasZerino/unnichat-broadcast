import type { ReactNode } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";

type Props = {
  open: boolean;
  title: string;
  children: ReactNode;
  error: string;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
};

export function ConfirmDeleteDialog({
  open,
  title,
  children,
  error,
  busy,
  onClose,
  onConfirm,
  confirmLabel = "Excluir",
}: Props) {
  return (
    <Dialog open={open} onClose={() => !busy && onClose()}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <p>{children}</p>
        {error && <Alert severity="error">{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button disabled={busy} onClick={onClose}>
          Cancelar
        </Button>
        <Button
          disabled={busy}
          color="error"
          variant="contained"
          onClick={onConfirm}
        >
          {busy ? "Excluindo…" : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

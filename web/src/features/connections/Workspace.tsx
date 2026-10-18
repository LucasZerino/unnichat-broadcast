import { useState } from "react";
import { signOut, type User } from "firebase/auth";
import { Alert, Button, LinearProgress, Snackbar } from "@mui/material";
import Add from "@mui/icons-material/Add";
import HubOutlined from "@mui/icons-material/HubOutlined";
import { auth, mutate } from "../../firebase";
import { useRecords } from "../../hooks/useRecords";
import { errorMessage } from "../../lib/errors";
import { EmptyState } from "../../components/EmptyState";
import { ConfirmDeleteDialog } from "../../components/ConfirmDeleteDialog";
import { WorkspaceHeader } from "../../components/WorkspaceHeader";
import { ConnectionSidebar } from "./ConnectionSidebar";
import { ConnectionDialog } from "./ConnectionDialog";
import { ConnectionView } from "./ConnectionView";
import type { Connection } from "../../types";

export function Workspace({ user }: { user: User }) {
  const connections = useRecords<Connection>("connections", user.uid);
  const [selected, setSelected] = useState("");
  const [editor, setEditor] = useState<Connection | null | undefined>(
    undefined,
  );
  const [deleting, setDeleting] = useState<Connection | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const sorted = [...connections.rows].sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR"),
  );
  const active = sorted.find((item) => item.id === selected) || sorted[0];

  async function remove() {
    if (!deleting) return;
    setBusy(true);
    setError("");
    try {
      await mutate({ action: "deleteConnection", connectionId: deleting.id });
      setDeleting(null);
      setNotice("Conexão e dados vinculados excluídos.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="shell">
      <ConnectionSidebar
        connections={sorted}
        loading={connections.loading}
        activeId={active?.id}
        onSelect={setSelected}
        onCreate={() => setEditor(null)}
      />
      <div className="workspace">
        <WorkspaceHeader
          email={user.email}
          onSignOut={() => {
            signOut(auth).catch(() =>
              setNotice("Não foi possível sair. Tente novamente."),
            );
          }}
        />
        <main className="content">
          {connections.error && (
            <Alert severity="error" className="mb-5">
              {connections.error}
            </Alert>
          )}
          {connections.loading ? (
            <LinearProgress />
          ) : active ? (
            <ConnectionView
              key={active.id}
              connection={active}
              userId={user.uid}
              onEdit={() => setEditor(active)}
              onDelete={() => {
                setError("");
                setDeleting(active);
              }}
              notify={setNotice}
            />
          ) : (
            <div className="surface">
              <EmptyState
                icon={<HubOutlined />}
                title="Comece pela primeira conexão"
                action={
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setEditor(null)}
                  >
                    Criar conexão
                  </Button>
                }
              >
                Dê um nome ao seu canal, adicione os contatos e prepare sua
                primeira mensagem.
              </EmptyState>
            </div>
          )}
        </main>
      </div>
      {editor !== undefined && (
        <ConnectionDialog
          connection={editor}
          onClose={() => setEditor(undefined)}
          notify={setNotice}
          onSaved={(id) => {
            setSelected(id);
            setEditor(undefined);
          }}
        />
      )}
      <ConfirmDeleteDialog
        open={!!deleting}
        title="Excluir conexão?"
        confirmLabel="Excluir conexão"
        error={error}
        busy={busy}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
      >
        Os contatos e as mensagens de <strong>{deleting?.name}</strong> também
        serão excluídos. Esta ação não pode ser desfeita.
      </ConfirmDeleteDialog>
      <Snackbar
        open={!!notice}
        autoHideDuration={5000}
        onClose={() => setNotice("")}
        message={notice}
      />
    </div>
  );
}

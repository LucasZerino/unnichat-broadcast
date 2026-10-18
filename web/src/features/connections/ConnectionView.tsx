import { useState } from "react";
import {
  Alert,
  Chip,
  IconButton,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import EditOutlined from "@mui/icons-material/EditOutlined";
import PeopleOutline from "@mui/icons-material/PeopleOutline";
import SendOutlined from "@mui/icons-material/SendOutlined";
import { mutate } from "../../firebase";
import { useRecords } from "../../hooks/useRecords";
import { errorMessage } from "../../lib/errors";
import { ConfirmDeleteDialog } from "../../components/ConfirmDeleteDialog";
import { ContactsPanel } from "../contacts/ContactsPanel";
import { ContactDialog } from "../contacts/ContactDialog";
import { MessagesPanel, type MessageFilter } from "../messages/MessagesPanel";
import { MessageDialog } from "../messages/MessageDialog";
import type { Broadcast, Connection, Contact } from "../../types";

type Props = {
  connection: Connection;
  userId: string;
  onEdit: () => void;
  onDelete: () => void;
  notify: (message: string) => void;
};

export function ConnectionView({
  connection,
  userId,
  onEdit,
  onDelete,
  notify,
}: Props) {
  const contacts = useRecords<Contact>("contacts", userId, connection.id);
  const messages = useRecords<Broadcast>("broadcasts", userId, connection.id);
  const [tab, setTab] = useState(0);
  const [contactEditor, setContactEditor] = useState<
    Contact | null | undefined
  >(undefined);
  const [messageEditor, setMessageEditor] = useState<
    Broadcast | null | undefined
  >(undefined);
  const [deleting, setDeleting] = useState<{
    kind: "contact" | "message";
    id: string;
    name: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<MessageFilter>("all");
  const scheduled = messages.rows.filter(
    (item) => item.status === "scheduled",
  ).length;
  const sent = messages.rows.filter((item) => item.status === "sent").length;

  async function remove() {
    if (!deleting) return;
    setBusy(true);
    setError("");
    try {
      await mutate({
        action:
          deleting.kind === "contact" ? "deleteContact" : "deleteBroadcast",
        connectionId: connection.id,
        ...(deleting.kind === "contact"
          ? { contactId: deleting.id }
          : { broadcastId: deleting.id }),
      });
      notify(
        deleting.kind === "contact"
          ? "Contato excluído."
          : "Mensagem excluída.",
      );
      setDeleting(null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-7">
        <div>
          <div className="flex items-center gap-3">
            <Typography
              component="h1"
              variant="h4"
              sx={{ overflowWrap: "anywhere" }}
            >
              {connection.name}
            </Typography>
            <Tooltip title="Editar conexão">
              <IconButton
                aria-label="Editar conexão"
                size="small"
                onClick={onEdit}
              >
                <EditOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Excluir conexão">
              <IconButton
                aria-label="Excluir conexão"
                size="small"
                onClick={onDelete}
              >
                <DeleteOutline fontSize="small" />
              </IconButton>
            </Tooltip>
          </div>
          <p className="muted text-sm mt-2">
            Acompanhe os contatos e mensagens desta conexão.
          </p>
        </div>
        <Chip
          size="small"
          variant="outlined"
          label="Envios simulados"
          sx={{ color: "#007c74", borderColor: "#badbd4", bgcolor: "#eff8f4" }}
        />
      </div>
      <div className="surface">
        <div className="stat-line">
          <div>
            <strong>{contacts.rows.length}</strong>
            <span>Contatos</span>
          </div>
          <div>
            <strong style={{ color: "#6953a1" }}>{scheduled}</strong>
            <span>Agendadas</span>
          </div>
          <div>
            <strong style={{ color: "#007c74" }}>{sent}</strong>
            <span>Enviadas</span>
          </div>
        </div>
        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          aria-label="Conteúdo da conexão"
          className="border-b border-slate-200 px-3"
        >
          <Tab
            icon={<SendOutlined fontSize="small" />}
            iconPosition="start"
            label="Mensagens"
            id="tab-messages"
            aria-controls="panel-messages"
          />
          <Tab
            icon={<PeopleOutline fontSize="small" />}
            iconPosition="start"
            label="Contatos"
            id="tab-contacts"
            aria-controls="panel-contacts"
          />
        </Tabs>
        {(contacts.error || messages.error) && (
          <Alert severity="error" className="m-5">
            {contacts.error || messages.error}
          </Alert>
        )}
        {tab === 0 ? (
          <MessagesPanel
            messages={messages.rows}
            loading={messages.loading}
            filter={filter}
            onFilterChange={setFilter}
            hasContacts={!!contacts.rows.length}
            contactsLoading={contacts.loading}
            contactsError={!!contacts.error}
            onCreate={() => setMessageEditor(null)}
            onEdit={setMessageEditor}
            onDelete={(message) => {
              setError("");
              setDeleting({
                kind: "message",
                id: message.id,
                name: message.text,
              });
            }}
          />
        ) : (
          <ContactsPanel
            contacts={contacts.rows}
            loading={contacts.loading}
            onCreate={() => setContactEditor(null)}
            onEdit={setContactEditor}
            onDelete={(contact) => {
              setError("");
              setDeleting({
                kind: "contact",
                id: contact.id,
                name: contact.name,
              });
            }}
          />
        )}
      </div>
      {contactEditor !== undefined && (
        <ContactDialog
          contact={contactEditor}
          connectionId={connection.id}
          onClose={() => setContactEditor(undefined)}
          notify={notify}
        />
      )}
      {messageEditor !== undefined && (
        <MessageDialog
          message={messageEditor}
          contacts={contacts.rows}
          connectionId={connection.id}
          onClose={() => setMessageEditor(undefined)}
          notify={notify}
        />
      )}
      <ConfirmDeleteDialog
        open={!!deleting}
        title={`Excluir ${deleting?.kind === "contact" ? "contato" : "mensagem"}?`}
        error={error}
        busy={busy}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
      >
        {deleting?.kind === "contact" ? (
          <>
            O contato <strong>{deleting.name}</strong> será removido. Mensagens
            existentes mantêm o registro do destinatário.
          </>
        ) : (
          "A mensagem será excluída e, se estiver agendada, não será mais processada."
        )}
      </ConfirmDeleteDialog>
    </>
  );
}

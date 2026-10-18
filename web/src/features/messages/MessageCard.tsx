import { Chip, IconButton, Tooltip } from "@mui/material";
import CheckCircleOutline from "@mui/icons-material/CheckCircleOutline";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import EditOutlined from "@mui/icons-material/EditOutlined";
import PeopleOutline from "@mui/icons-material/PeopleOutline";
import Schedule from "@mui/icons-material/Schedule";
import { dateText } from "../../lib/dates";
import type { Broadcast } from "../../types";

type MessageCardProps = {
  message: Broadcast;
  onEdit: (message: Broadcast) => void;
  onDelete: (message: Broadcast) => void;
};

export function MessageCard({ message, onEdit, onDelete }: MessageCardProps) {
  return (
    <article className="message-card">
      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center flex-wrap gap-3">
          <Chip
            size="small"
            icon={
              message.status === "sent" ? <CheckCircleOutline /> : <Schedule />
            }
            label={message.status === "sent" ? "Enviada" : "Agendada"}
            sx={{
              bgcolor: message.status === "sent" ? "#eaf6f0" : "#f1edfa",
              color: message.status === "sent" ? "#007c74" : "#6953a1",
            }}
          />
          <span className="muted text-xs">
            {dateText(
              message.status === "sent" ? message.sentAt : message.scheduledAt,
            )}
          </span>
        </div>
        <div className="flex">
          <Tooltip title="Editar mensagem">
            <IconButton
              aria-label="Editar mensagem"
              size="small"
              onClick={() => onEdit(message)}
            >
              <EditOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Excluir mensagem">
            <IconButton
              aria-label="Excluir mensagem"
              size="small"
              onClick={() => onDelete(message)}
            >
              <DeleteOutline fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>
      </div>
      <p className="message-copy">{message.text}</p>
      <div className="flex gap-2 flex-wrap items-center">
        <PeopleOutline sx={{ fontSize: 16, color: "#657389" }} />
        <span className="text-xs muted">
          {message.recipients.length}{" "}
          {message.recipients.length === 1 ? "destinatário" : "destinatários"}:
        </span>
        <span className="text-xs muted">
          {message.recipients.map((person) => person.name).join(", ")}
        </span>
      </div>
    </article>
  );
}

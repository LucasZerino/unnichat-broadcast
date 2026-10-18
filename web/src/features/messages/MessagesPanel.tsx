import {
  Button,
  LinearProgress,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import Add from "@mui/icons-material/Add";
import SendOutlined from "@mui/icons-material/SendOutlined";
import { EmptyState } from "../../components/EmptyState";
import type { Broadcast } from "../../types";
import { MessageCard } from "./MessageCard";

export type MessageFilter = "all" | Broadcast["status"];

type MessagesPanelProps = {
  messages: Broadcast[];
  loading: boolean;
  filter: MessageFilter;
  onFilterChange: (filter: MessageFilter) => void;
  hasContacts: boolean;
  contactsLoading: boolean;
  contactsError: boolean;
  onCreate: () => void;
  onEdit: (message: Broadcast) => void;
  onDelete: (message: Broadcast) => void;
};

export function MessagesPanel({
  messages,
  loading,
  filter,
  onFilterChange,
  hasContacts,
  contactsLoading,
  contactsError,
  onCreate,
  onEdit,
  onDelete,
}: MessagesPanelProps) {
  const shownMessages = [...messages]
    .filter((item) => filter === "all" || item.status === filter)
    .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

  return (
    <section role="tabpanel" id="panel-messages" aria-labelledby="tab-messages">
      <div className="flex flex-wrap gap-4 justify-between items-center px-6 py-5">
        <div>
          <Typography component="h2" variant="h6" fontWeight={650}>
            Seus envios
          </Typography>
          <p className="muted text-xs mt-1">
            Agendamentos são processados mesmo com a aplicação fechada.
          </p>
        </div>
        <Button
          variant="contained"
          startIcon={<Add />}
          disabled={contactsLoading || contactsError || !hasContacts}
          onClick={onCreate}
        >
          Nova mensagem
        </Button>
      </div>
      <div className="px-6 pb-4 flex items-center gap-3">
        <Typography variant="body2" color="text.secondary">
          Exibir
        </Typography>
        <Select
          size="small"
          value={filter}
          onChange={(e) => onFilterChange(e.target.value as MessageFilter)}
          inputProps={{ "aria-label": "Filtrar mensagens" }}
        >
          <MenuItem value="all">Todas as mensagens</MenuItem>
          <MenuItem value="scheduled">Agendadas</MenuItem>
          <MenuItem value="sent">Enviadas</MenuItem>
        </Select>
      </div>
      {loading ? (
        <LinearProgress />
      ) : !shownMessages.length ? (
        <EmptyState
          icon={<SendOutlined />}
          title={
            filter === "all"
              ? "Sua primeira mensagem começa aqui"
              : "Nenhuma mensagem neste filtro"
          }
        >
          {filter !== "all"
            ? "Escolha outro filtro para ver os demais envios."
            : hasContacts
              ? "Selecione os contatos e envie agora ou escolha o melhor horário."
              : "Adicione um contato na aba Contatos para preparar seu primeiro envio."}
        </EmptyState>
      ) : (
        shownMessages.map((message) => (
          <MessageCard
            key={message.id}
            message={message}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
      )}
    </section>
  );
}

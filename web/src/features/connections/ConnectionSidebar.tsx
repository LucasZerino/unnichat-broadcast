import { IconButton, LinearProgress, Tooltip, Typography } from "@mui/material";
import Add from "@mui/icons-material/Add";
import CheckCircleOutline from "@mui/icons-material/CheckCircleOutline";
import HubOutlined from "@mui/icons-material/HubOutlined";
import { Brand } from "../../components/Brand";
import type { Connection } from "../../types";

type Props = {
  connections: Connection[];
  loading: boolean;
  activeId?: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
};

export function ConnectionSidebar({
  connections,
  loading,
  activeId,
  onSelect,
  onCreate,
}: Props) {
  return (
    <aside className="sidebar">
      <Brand />
      <div className="flex justify-between items-center px-2">
        <Typography variant="body2" color="text.secondary">
          Suas conexões
        </Typography>
        <Tooltip title="Criar conexão">
          <IconButton
            size="small"
            aria-label="Criar conexão"
            onClick={onCreate}
          >
            <Add fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>
      <div className="connection-list flex-1">
        {loading ? (
          <LinearProgress />
        ) : (
          connections.map((item) => (
            <button
              key={item.id}
              className="connection-item"
              data-active={activeId === item.id}
              onClick={() => onSelect(item.id)}
            >
              <HubOutlined fontSize="small" />
              <span className="flex-1 truncate font-semibold text-sm">
                {item.name}
              </span>
              <span className="text-xs">{item.contactCount}</span>
            </button>
          ))
        )}
        {!loading && !connections.length && (
          <p className="muted text-sm px-2">
            Sua primeira conexão aparece aqui.
          </p>
        )}
      </div>
      <div className="sidebar-footer border-t border-slate-200 pt-5">
        <div className="flex gap-2 items-start text-sm">
          <CheckCircleOutline sx={{ fontSize: 18, color: "#007c74" }} />
          <span className="muted">
            Um espaço exclusivo para suas conexões e contatos.
          </span>
        </div>
      </div>
    </aside>
  );
}

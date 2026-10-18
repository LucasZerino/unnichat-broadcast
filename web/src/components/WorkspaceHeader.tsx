import { Avatar, IconButton, Tooltip } from "@mui/material";
import Logout from "@mui/icons-material/Logout";

export function WorkspaceHeader({
  email,
  onSignOut,
}: {
  email: string | null;
  onSignOut: () => void;
}) {
  return (
    <header className="topbar">
      <div>
        <div className="font-semibold text-sm">Central de mensagens</div>
        <div className="text-xs muted mt-1">
          Prepare, organize e acompanhe seus envios
        </div>
      </div>
      <div className="flex gap-2 items-center min-w-0">
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: "#eaf0fd",
            color: "#2446a8",
            fontSize: 14,
          }}
        >
          {email?.slice(0, 1).toUpperCase()}
        </Avatar>
        <span className="text-sm truncate max-w-40 hidden sm:block">
          {email}
        </span>
        <Tooltip title="Sair da conta">
          <IconButton aria-label="Sair da conta" onClick={onSignOut}>
            <Logout fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>
    </header>
  );
}

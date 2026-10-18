import { CircularProgress } from "@mui/material";
import { AuthScreen } from "./features/auth/AuthScreen";
import { Workspace } from "./features/connections/Workspace";
import { useAuth } from "./hooks/useAuth";

export default function App() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-dvh grid place-items-center">
        <CircularProgress aria-label="Carregando sessão" />
      </div>
    );
  }
  return user ? <Workspace key={user.uid} user={user} /> : <AuthScreen />;
}

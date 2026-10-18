import type { ReactNode } from "react";
import { Typography } from "@mui/material";
export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <Typography variant="h6" fontWeight={650}>
        {title}
      </Typography>
      <p className="muted text-sm leading-6 mt-2 mb-5">{children}</p>
      {action}
    </div>
  );
}

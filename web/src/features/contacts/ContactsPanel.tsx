import { useState } from "react";
import {
  Avatar,
  Button,
  IconButton,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import Add from "@mui/icons-material/Add";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import EditOutlined from "@mui/icons-material/EditOutlined";
import PeopleOutline from "@mui/icons-material/PeopleOutline";
import Search from "@mui/icons-material/Search";
import { EmptyState } from "../../components/EmptyState";
import type { Contact } from "../../types";

type ContactsPanelProps = {
  contacts: Contact[];
  loading: boolean;
  onCreate: () => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
};

export function ContactsPanel({
  contacts,
  loading,
  onCreate,
  onEdit,
  onDelete,
}: ContactsPanelProps) {
  const [search, setSearch] = useState("");
  const shownContacts = [...contacts]
    .filter((item) =>
      (item.name + " " + item.phone)
        .toLowerCase()
        .includes(search.toLowerCase()),
    )
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  return (
    <section role="tabpanel" id="panel-contacts" aria-labelledby="tab-contacts">
      <div className="flex flex-wrap gap-4 justify-between items-center px-6 py-5">
        <Typography component="h2" variant="h6" fontWeight={650}>
          Lista de contatos
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={onCreate}>
          Novo contato
        </Button>
      </div>
      <div className="px-6 pb-5">
        <TextField
          label="Buscar contato"
          placeholder="Nome ou telefone"
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <Search fontSize="small" className="mr-2 muted" />,
          }}
        />
      </div>
      {loading ? (
        <LinearProgress />
      ) : !shownContacts.length ? (
        <EmptyState
          icon={<PeopleOutline />}
          title={
            search
              ? "Nenhum contato encontrado"
              : "Dê um nome à próxima conversa"
          }
        >
          {search
            ? "Tente buscar por outro nome ou telefone."
            : "Adicione o nome e o telefone dos contatos desta conexão."}
        </EmptyState>
      ) : (
        <TableContainer>
          <Table aria-label="Contatos desta conexão">
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Telefone</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {shownContacts.map((person) => (
                <TableRow key={person.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: "#edf2ff",
                          color: "#2446a8",
                          fontSize: 13,
                        }}
                      >
                        {person.name.slice(0, 1).toUpperCase()}
                      </Avatar>
                      <span className="font-medium">{person.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{person.phone}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      aria-label={"Editar " + person.name}
                      size="small"
                      onClick={() => onEdit(person)}
                    >
                      <EditOutlined fontSize="small" />
                    </IconButton>
                    <IconButton
                      aria-label={"Excluir " + person.name}
                      size="small"
                      onClick={() => onDelete(person)}
                    >
                      <DeleteOutline fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </section>
  );
}

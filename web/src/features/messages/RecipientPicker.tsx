import { Button, Checkbox, FormControlLabel, Typography } from "@mui/material";
import type { Contact } from "../../types";

type RecipientPickerProps = {
  contacts: Contact[];
  selectedIds: string[];
  disabled: boolean;
  onChange: (ids: string[]) => void;
};

export function RecipientPicker({
  contacts,
  selectedIds,
  disabled,
  onChange,
}: RecipientPickerProps) {
  return (
    <div>
      <div className="flex justify-between items-center">
        <Typography variant="subtitle2">Destinatários</Typography>
        <Button
          size="small"
          disabled={disabled || !contacts.length}
          onClick={() =>
            onChange(
              selectedIds.length === contacts.length
                ? []
                : contacts.map((person) => person.id),
            )
          }
        >
          {selectedIds.length === contacts.length
            ? "Desmarcar todos"
            : "Selecionar todos"}
        </Button>
      </div>
      <div className="border border-slate-200 rounded-lg max-h-44 overflow-y-auto px-2">
        {contacts.length ? (
          contacts.map((person) => (
            <FormControlLabel
              key={person.id}
              sx={{ display: "flex", m: 0 }}
              control={
                <Checkbox
                  size="small"
                  checked={selectedIds.includes(person.id)}
                  disabled={disabled}
                  onChange={(_, checked) =>
                    onChange(
                      checked
                        ? [...selectedIds, person.id]
                        : selectedIds.filter((id) => id !== person.id),
                    )
                  }
                />
              }
              label={
                <div className="flex flex-wrap gap-x-3 text-sm">
                  <span>{person.name}</span>
                  <span className="muted">{person.phone}</span>
                </div>
              }
            />
          ))
        ) : (
          <p className="text-sm muted p-3">
            Adicione um contato antes de editar os destinatários.
          </p>
        )}
      </div>
      <p className="text-xs muted mt-1">{selectedIds.length} selecionado(s)</p>
    </div>
  );
}

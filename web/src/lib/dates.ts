export const dateText = (value: { toDate(): Date } | null) =>
  value
    ? new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(value.toDate())
    : "—";

export const dateInput = (millis: number) => {
  const date = new Date(millis);
  return new Date(millis - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

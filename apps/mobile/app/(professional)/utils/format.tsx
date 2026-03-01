export function formatFCFA(amount: number) {
  return `${amount.toLocaleString("fr-FR")} FCFA`;
}

export function formatDateFR(dateISO: string) {
  // "2026-01-07" -> "07/01/2026"
  const d = new Date(dateISO);
  return d.toLocaleDateString("fr-FR");
}

export function formatTimeFR(dateTimeISOorStr: string) {
  // "2026-01-07 14:30" or ISO; best effort
  const parts = dateTimeISOorStr.split(" ");
  if (parts.length === 2) return parts[1];
  const d = new Date(dateTimeISOorStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
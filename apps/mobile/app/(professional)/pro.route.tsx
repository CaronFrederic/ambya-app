export type ProRoute =
  | "/professional"
  | "/professional/EmployeeManagement"
  | "/professional/ExpenseManagement"
  | "/professional/AccountingReports"
  | "/professional/cash-register"
  | "/professional/salon-settings"
  | "/professional/promotions"
  | "/professional/loyalty"
  | "/professional/booking-history"
  | `/professional/client-details/${string}`;

export type ProScreenKey =
  | "dashboard"
  | "employees"
  | "expenses"
  | "accounting"
  | "cash"
  | "settings"
  | "promotions"
  | "loyalty"
  | "bookings"
  | "clientDetails";

export const PRO_SCREENS: Record<ProScreenKey, { title: string; route: ProRoute }> = {
  dashboard:     { title: "Dashboard", route: "/professional" },
  employees:     { title: "Employés", route: "/professional/EmployeeManagement" },
  expenses:      { title: "Dépenses", route: "/professional/ExpenseManagement" },
  accounting:    { title: "Comptabilité", route: "/professional/AccountingReports" },
  cash:          { title: "Caisse", route: "/professional/cash-register" },
  settings:      { title: "Paramètres salon", route: "/professional/salon-settings" },
  promotions:    { title: "Promotions", route: "/professional/promotions" },
  loyalty:       { title: "Fidélité", route: "/professional/loyalty" },
  bookings:      { title: "Historique", route: "/professional/booking-history" },
  clientDetails: { title: "Fiche client", route: "/professional/client-details/1" }, // mock
};
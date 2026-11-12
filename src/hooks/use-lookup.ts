import { useBank } from "@/services/store";
/** Name lookups for staff screens. */
export function useLookup() {
  const customers = useBank((s) => s.customers);
  const accounts = useBank((s) => s.accounts);
  const cust = (id: string) => customers.find((c) => c.id === id);
  const custName = (id: string) => { const c = cust(id); return c ? `${c.firstName} ${c.lastName}` : id; };
  const acct = (id: string) => accounts.find((a) => a.id === id);
  return { cust, custName, acct, customers, accounts };
}

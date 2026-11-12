import { useMemo } from "react";
import { getSession } from "@/lib/auth";
import { useBank } from "@/services/store";

/** Current signed-in customer and their owned records. */
export function useCustomer() {
  const id = getSession()?.userId ?? "C0001";
  const customer = useBank((s) => s.customers.find((c) => c.id === id)!);
  const allAccounts = useBank((s) => s.accounts);
  const allTxns = useBank((s) => s.transactions);
  const accounts = useMemo(() => allAccounts.filter((a) => a.customerId === id), [allAccounts, id]);
  const txns = useMemo(() => { const ids = new Set(accounts.map((a) => a.id)); return allTxns.filter((t) => ids.has(t.accountId)); }, [allTxns, accounts]);
  return { id, customer, accounts, txns };
}

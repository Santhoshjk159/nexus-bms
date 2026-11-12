import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Amount, KV, StatusBadge } from "./ui";
import { fmtDateTime, humanize, mask } from "@/lib/format";
import { useBank } from "@/services/store";
import type { Transaction } from "@/types";
import type { ReactNode } from "react";

export function TxnDrawer({ txn, onClose, footer }: { txn: Transaction | null; onClose: () => void; footer?: ReactNode }) {
  const acct = useBank((s) => s.accounts.find((a) => a.id === txn?.accountId));
  const ledger = useBank((s) => s.ledgerEntries.filter((l) => l.transactionRef === txn?.reference));
  const gl = useBank((s) => s.ledgerAccounts);
  return (
    <Sheet open={!!txn} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {txn && (<>
          <SheetHeader><SheetTitle>Transaction details</SheetTitle><SheetDescription className="num">{txn.reference}</SheetDescription></SheetHeader>
          <div className="mt-6 rounded-lg bg-muted p-4 text-center">
            <Amount value={txn.amount} type={txn.type} className="text-2xl" />
            <p className="mt-1 text-sm text-muted-foreground">{txn.description}</p>
            <div className="mt-2"><StatusBadge status={txn.status} /></div>
          </div>
          <div className="mt-6"><KV items={[["Type", humanize(txn.type)], ["Category", humanize(txn.category)], ["Counterparty", txn.counterparty], ["Channel", humanize(txn.channel)], ["Account", acct ? <span className="num">{mask(acct.accountNumber)}</span> : "—"], ["Date & time", fmtDateTime(txn.createdAt)], ["Balance after", <Amount key="b" value={txn.balanceAfter} />], ["Risk flag", txn.flagged ? "Flagged for review" : "None"]]} /></div>
          {ledger.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ledger postings</p>
              <div className="overflow-hidden rounded-md border border-border text-xs">
                {ledger.map((l) => (<div key={l.id} className="flex justify-between border-b border-border px-3 py-2 last:border-0"><span>{gl.find((g) => g.id === l.ledgerAccountId)?.name}</span><span className="num">{l.debit ? `Dr ${l.debit.toLocaleString("en-IN")}` : `Cr ${l.credit.toLocaleString("en-IN")}`}</span></div>))}
              </div>
            </div>
          )}
          {footer && <div className="mt-6 flex flex-wrap gap-2">{footer}</div>}
        </>)}
      </SheetContent>
    </Sheet>
  );
}

import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { isPaidStatus, isPendingStatus, isFailedStatus } from "@/utils/type-guards";

export const PaymentStatus = ({ status }: { status: string }) => {
  const paid = isPaidStatus(status);
  const failed = isFailedStatus(status);
  const pending = isPendingStatus(status);

  const cls = paid
    ? "bg-emerald-50 text-emerald-700"
    : failed
      ? "bg-red-50 text-red-700"
      : "bg-amber-50 text-amber-700";

  const Icon = paid ? CheckCircle2 : failed ? XCircle : pending ? Clock : Clock;

  return (
    <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md ${cls}`}>
      <Icon className="w-3 h-3" />
      <span className="capitalize">{status}</span>
    </div>
  );
};

import * as React from "react";
import {
  Calendar,
  Download,
  TrendingUp,
  DollarSign,
  Filter,
  ArrowRightLeft,
  HelpCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

import { StatsTile } from "@/components/ui/stats-tile";
import { TablePlaceholder } from "@/components/ui/table-placeholder";
import { cn } from "@/utils/cn";
import { useAuth } from "@/components/Layout";
import useRequireRole from "@/hooks/useRequireRole";
import { fetchCommissionStatement } from "@/actions/agentActions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CommissionStats {
  total_commission: number;
  paid_commission: number;
  pending_commission: number;
  transaction_count: number;
}

const Tooltip = ({ text }: { text: string }) => {
  const [isVisible, setIsVisible] = React.useState(false);

  return (
    <div className="relative">
      <button
        className="text-muted-foreground hover:text-foreground"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
      >
        <HelpCircle className="h-4 w-4" />
      </button>

      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -right-2 bottom-full z-50 mb-2 w-60 rounded-lg bg-popover p-3 text-sm text-popover-foreground shadow-md"
        >
          {text}
          <div className="absolute -bottom-1 right-2 h-2 w-2 rotate-45 bg-popover" />
        </motion.div>
      )}
    </div>
  );
};

export default function AgentCommissions() {
  const { user, profile } = useAuth();
  const { isLoading: isAuthLoading } = useRequireRole("agent");

  const [dateRange, setDateRange] = React.useState<
    "all" | "mtd" | "past30" | "past90"
  >("mtd");

  const [isUpdateModalOpen, setIsUpdateModalOpen] = React.useState(false);

  const { startDate, endDate } = React.useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let start = new Date();
    let end = new Date(today);
    end.setHours(23, 59, 59, 999); // End of today

    switch (dateRange) {
      case "mtd":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "past30":
        start = new Date(today);
        start.setDate(today.getDate() - 30);
        break;
      case "past90":
        start = new Date(today);
        start.setDate(today.getDate() - 90);
        break;
      case "all":
        start = new Date(2000, 0, 1); // A long time ago
        break;
    }
    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };
  }, [dateRange]);

  const { data: statementData, isLoading: isStatementLoading } = useQuery({
    queryKey: ["commission-statement", user?.id, startDate, endDate],
    queryFn: () =>
      fetchCommissionStatement(user?.id || "", { startDate, endDate }),
    enabled: !!user?.id,
  });

  if (isAuthLoading || isStatementLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  const summaryStats: CommissionStats =
    (statementData?.data?.stats as unknown as CommissionStats) || {
      total_commission: 0,
      paid_commission: 0,
      pending_commission: 0,
      transaction_count: 0,
    };

  const bankDetails = {
    accountName: profile?.full_name || user?.email,
    accountNumber: "1234567890",
    bankName: "FNB",
    branchCode: "250655",
    accountType: "Business",
    reference: "AV-AGENT-" + user?.id.split("-")[0].toUpperCase(),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Commission Statement
        </h1>
        <p className="text-muted-foreground">
          Track your earnings and commission from retailer sales.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsTile
          label="Total Commission"
          value={`R ${summaryStats.total_commission.toFixed(2)}`}
          icon={TrendingUp}
          intent="info"
          subtitle={`${summaryStats.transaction_count} transactions this period`}
        />
        <StatsTile
          label="Commission Paid"
          value={`R ${summaryStats.paid_commission.toFixed(2)}`}
          icon={DollarSign}
          intent="success"
          subtitle="Total paid out"
        />
        <StatsTile
          label="Pending Payout"
          value={`R ${summaryStats.pending_commission.toFixed(2)}`}
          icon={Calendar}
          intent="warning"
          subtitle="Will be paid on next cycle"
        />
      </div>

      {/* Filter controls */}
      <motion.div
        className="flex flex-col gap-4 sm:flex-row sm:items-center justify-end"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={dateRange}
              onChange={(e) =>
                setDateRange(e.target.value as any)
              }
              className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="mtd">This Month</option>
              <option value="past30">Past 30 Days</option>
              <option value="past90">Past 90 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <button className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90">
            <Download className="mr-2 h-4 w-4" />
            Export
          </button>
        </div>
      </motion.div>

      <div className="mt-8 rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">
          Commission Payout Schedule
        </h2>
        <div className="space-y-6">
          <div className="flex flex-col gap-1.5">
            <div className="text-sm font-medium">Next Payout Date</div>
            <div className="text-2xl font-semibold text-primary">
              15 May 2025
            </div>
            <div className="text-sm text-muted-foreground">
              Pending commission will be processed and paid on this date.
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium">Payment Information</h3>
              <div className="flex items-center">
                <button
                  onClick={() => setIsUpdateModalOpen(true)}
                  className="rounded-md px-2.5 py-1.5 text-sm font-medium text-primary hover:bg-primary/10"
                >
                  Update
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Account Name</p>
                <p className="font-medium">{bankDetails.accountName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Account Number</p>
                <p className="font-medium">{bankDetails.accountNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bank</p>
                <p className="font-medium">{bankDetails.bankName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Branch Code</p>
                <p className="font-medium">{bankDetails.branchCode}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Account Type</p>
                <p className="font-medium">{bankDetails.accountType}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reference</p>
                <p className="font-medium">{bankDetails.reference}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Payment Details</DialogTitle>
            <DialogDescription>
              Ensure your banking information is correct to receive payouts.
              Changes may require verification.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bankName" className="text-right">
                Bank Name
              </Label>
              <Input
                id="bankName"
                defaultValue={bankDetails.bankName}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="accountName" className="text-right">
                Account Name
              </Label>
              <Input
                id="accountName"
                defaultValue={bankDetails.accountName || ""}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="accountNumber" className="text-right">
                Account Number
              </Label>
              <Input
                id="accountNumber"
                defaultValue={bankDetails.accountNumber}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="branchCode" className="text-right">
                Branch Code
              </Label>
              <Input
                id="branchCode"
                defaultValue={bankDetails.branchCode}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="accountType" className="text-right">
                Account Type
              </Label>
              <Input
                id="accountType"
                defaultValue={bankDetails.accountType}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsUpdateModalOpen(false)}
              type="button"
              className="rounded-md bg-background px-4 py-2 text-sm font-medium text-secondary-foreground"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // Add save logic here
                setIsUpdateModalOpen(false);
              }}
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
            >
              Save changes
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

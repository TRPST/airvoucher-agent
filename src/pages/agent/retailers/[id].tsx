import * as React from "react";
import { useRouter } from "next/router";
import {
  Users,
  TrendingUp,
  Activity,
  Phone,
  Mail,
  Calendar,
  ChevronLeft,
  Award,
} from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

import { StatsTile } from "@/components/ui/stats-tile";
import { ChartPlaceholder } from "@/components/ui/chart-placeholder";
import { TablePlaceholder } from "@/components/ui/table-placeholder";
import { cn } from "@/utils/cn";
import useRequireRole from "@/hooks/useRequireRole";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchRetailerDetail,
  fetchRetailerSales,
  fetchRetailerSalesSummary,
  type RetailerDetail,
  type RetailerSale,
  type RetailerSalesSummary,
} from "@/actions/agentActions";

export default function RetailerDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  // Protect this route - only allow agent role
  const { isLoading: isAuthLoading } = useRequireRole("agent");
  const { user } = useAuth();

  // Fetch retailer data
  const { data: retailerData, isLoading: isRetailerLoading } = useQuery({
    queryKey: ["retailer-detail", id, user?.id],
    queryFn: () => fetchRetailerDetail(id as string, user?.id || ""),
    enabled: !!id && !!user?.id,
  });

  // Fetch retailer sales
  const { data: salesData, isLoading: isSalesLoading } = useQuery({
    queryKey: ["retailer-sales", id],
    queryFn: () => fetchRetailerSales(id as string, 10),
    enabled: !!id,
  });

  // Fetch sales summary
  const { data: summaryData, isLoading: isSummaryLoading } = useQuery({
    queryKey: ["retailer-sales-summary", id],
    queryFn: () => fetchRetailerSalesSummary(id as string),
    enabled: !!id,
  });

  // Calculate MTD commission
  const mtdCommission = React.useMemo(() => {
    const sales = salesData?.data || [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return sales
      .filter((sale) => {
        const saleDate = new Date(sale.created_at);
        return (
          saleDate.getMonth() === currentMonth &&
          saleDate.getFullYear() === currentYear
        );
      })
      .reduce((sum, sale) => sum + sale.agent_commission, 0);
  }, [salesData?.data]);

  // Show loading state while checking authentication or loading data
  if (isAuthLoading || isRetailerLoading || isSalesLoading || isSummaryLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  // Handle error states
  if (retailerData?.error || !retailerData?.data) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Error Loading Retailer</h2>
          <p className="text-muted-foreground">
            {retailerData?.error?.message || "Retailer not found or access denied"}
          </p>
          <button
            onClick={() => router.push("/agent/")}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const retailer: RetailerDetail = retailerData.data;
  const sales: RetailerSale[] = salesData?.data || [];
  const summary: RetailerSalesSummary = summaryData?.data || {
    today_count: 0,
    today_value: 0,
    mtd_count: 0,
    mtd_value: 0,
    total_count: 0,
    total_value: 0,
  };

  // Format sales data for the table
  const recentActivityData = sales.map((sale) => {
    const saleDate = new Date(sale.created_at);

    return {
      Date: saleDate.toLocaleDateString("en-ZA", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      Time: saleDate.toLocaleTimeString("en-ZA", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      Type: sale.voucher_type,
      Value: `R ${sale.sale_amount.toFixed(2)}`,
      Commission: `R ${sale.agent_commission.toFixed(2)}`,
    };
  });

  // Animation variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <button
          onClick={() => router.push("/agent/")}
          className="mb-4 flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Dashboard
        </button>

        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Retailer Detail
        </h1>
        <p className="text-muted-foreground">
          Detailed information and performance metrics for {retailer.name}.
        </p>
      </div>

      {/* Retailer Profile */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-6 lg:grid-cols-3"
      >
        {/* Profile Card */}
        <motion.div
          variants={itemVariants}
          className="rounded-lg border border-border bg-card p-6 shadow-sm lg:col-span-1"
        >
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-semibold">
              {retailer.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{retailer.name}</h2>
              <div
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                  retailer.status === "active"
                    ? "bg-green-500/10 text-green-500"
                    : retailer.status === "inactive"
                    ? "bg-amber-500/10 text-amber-500"
                    : "bg-red-500/10 text-red-500"
                )}
              >
                {retailer.status.charAt(0).toUpperCase() +
                  retailer.status.slice(1)}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-2 text-sm">
              <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <span>{retailer.email}</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <span>{retailer.contact}</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <span>
                Joined{" "}
                {new Date(retailer.created_at).toLocaleDateString("en-ZA", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            {retailer.location && (
              <div className="flex items-start gap-2 text-sm">
                <Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <span>{retailer.location}</span>
              </div>
            )}
            <div className="flex items-start gap-2 text-sm">
              <Award className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <span>
                {retailer.terminals.length} Active Terminal
                {retailer.terminals.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div variants={itemVariants} className="space-y-4 lg:col-span-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatsTile
              label="Available Balance"
              value={`R ${retailer.balance.toFixed(2)}`}
              intent="info"
              subtitle="Current retailer balance"
            />
            <StatsTile
              label="Sales (MTD)"
              value={`R ${summary.mtd_value.toFixed(2)}`}
              intent="success"
              subtitle={`${summary.mtd_count} transactions this month`}
            />
            <StatsTile
              label="My Commission"
              value={`R ${mtdCommission.toFixed(2)}`}
              intent="warning"
              subtitle="Agent earnings from this retailer"
            />
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <ChartPlaceholder
              title="Sales Trend"
              description="Monthly sales performance for this retailer"
              height="sm"
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="mb-4 text-xl font-semibold">Recent Activity</h2>

        <TablePlaceholder
          columns={["Date", "Time", "Type", "Value", "Commission"]}
          data={recentActivityData}
          emptyMessage="No recent activity found for this retailer."
          size="md"
        />
      </motion.div>

      {/* Terminals Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-lg border border-border bg-card p-6 shadow-sm"
      >
        <h2 className="mb-4 text-xl font-semibold">
          Terminals ({retailer.terminals.length})
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {retailer.terminals.map((terminal) => (
            <div
              key={terminal.id}
              className="rounded-lg border border-border bg-muted/40 p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-medium">{terminal.name}</h3>
                <div
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs",
                    terminal.status === "active"
                      ? "bg-green-500/10 text-green-500"
                      : "bg-amber-500/10 text-amber-500"
                  )}
                >
                  {terminal.status}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Last active:{" "}
                {new Date(terminal.last_active).toLocaleString("en-ZA")}
              </p>
            </div>
          ))}
        </div>

        {retailer.terminals.length === 0 && (
          <div className="rounded-lg border border-border bg-muted/30 p-8 text-center">
            <p className="text-muted-foreground">
              No terminals found for this retailer.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

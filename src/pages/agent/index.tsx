import * as React from "react";
import { Users, TrendingUp, Activity, Search, ArrowUpDown, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

import { StatsTile } from "@/components/ui/stats-tile";
import { ChartPlaceholder } from "@/components/ui/chart-placeholder";
import { TablePlaceholder } from "@/components/ui/table-placeholder";
import { cn } from "@/utils/cn";
import useRequireRole from "@/hooks/useRequireRole";
import { fetchMyRetailers, fetchAgentSummary, fetchAgentStatements, type AgentStatement } from "@/actions/agentActions";
import { useAuth } from "@/hooks/useAuth";

export default function AgentDashboard() {
  // Protect this route - only allow agent role
  const { isLoading: isAuthLoading } = useRequireRole("agent");
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = React.useState("");
  const [sortBy, setSortBy] = React.useState<string>("name");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  // Fetch agent data
  const { data: retailersData, isLoading: isRetailersLoading } = useQuery({
    queryKey: ["agent-retailers", user?.id],
    queryFn: () => fetchMyRetailers(user?.id || ""),
    enabled: !!user?.id,
  });

  const { data: summaryData, isLoading: isSummaryLoading } = useQuery({
    queryKey: ["agent-summary", user?.id],
    queryFn: () => fetchAgentSummary(user?.id || ""),
    enabled: !!user?.id,
  });

  const { data: statementsData, isLoading: isStatementsLoading } = useQuery({
    queryKey: ["agent-statements", user?.id],
    queryFn: () => fetchAgentStatements(user?.id || "", {}),
    enabled: !!user?.id,
  });

  // Show loading state while checking authentication or loading data
  if (isAuthLoading || isRetailersLoading || isSummaryLoading || isStatementsLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  // Get the retailers data
  const retailers = retailersData?.data || [];
  const summary = summaryData?.data;
  const statements = statementsData?.data || [];

  // Apply filters and sorting
  const filteredRetailers = retailers
    .filter((retailer) => {
      const matchesSearch =
        retailer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (retailer.location?.toLowerCase() || "").includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || retailer.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;

      if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === "total_sales") {
        comparison = (b.total_sales ?? 0) - (a.total_sales ?? 0);
      } else if (sortBy === "commission") {
        comparison = b.commission_balance - a.commission_balance;
      } else if (sortBy === "status") {
        comparison = a.status.localeCompare(b.status);
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

  // Format data for table
  const tableData = filteredRetailers.map((retailer) => ({
    Retailer: (
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
          {retailer.name.charAt(0)}
        </div>
        <div>
          <div className="font-medium">{retailer.name}</div>
          <div className="text-xs text-muted-foreground">
            {retailer.location}
          </div>
        </div>
      </div>
    ),
    "Total Sales": `R ${retailer.total_sales?.toFixed(2) ?? "0.00"}`,
    Commission: `R ${retailer.commission_balance.toFixed(2)}`,
    Status: (
      <div className="flex items-center">
        <div
          className={cn(
            "mr-2 h-2 w-2 rounded-full",
            retailer.status === "active"
              ? "bg-green-500"
              : retailer.status === "inactive"
              ? "bg-amber-500"
              : "bg-red-500"
          )}
        />
        <span className="text-xs capitalize">{retailer.status}</span>
      </div>
    ),
    Actions: (
      <a
        href={`/agent/retailers/${retailer.id}`}
        className="rounded-md px-2.5 py-1 text-xs text-primary hover:bg-primary/10"
      >
        View Details
      </a>
    ),
  }));

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Agent Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.user_metadata?.full_name}. Here's an overview of your portfolio.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsTile
          label="My Retailers"
          value={summary?.retailer_count.toString() || "0"}
          icon={Users}
          intent="info"
          subtitle="Active accounts"
        />
        <StatsTile
          label="Total Commissions"
          value={`R ${summary?.total_commission?.toFixed(2) || "0.00"}`}
          icon={TrendingUp}
          intent="success"
          subtitle="Total earned"
        />
        <StatsTile
          label="Commissions Paid"
          value={`R ${summary?.paid_commission?.toFixed(2) || "0.00"}`}
          icon={Activity}
          intent="warning"
          subtitle="Total paid out"
        />
      </div>

      {/* Retailers Table Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">My Retailers</h2>
        </div>

        {/* Filters Section */}
        <motion.div
          className="flex flex-col gap-4 sm:flex-row sm:items-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search retailers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <button
              onClick={() => handleSort("name")}
              className="flex items-center gap-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <span>{sortOrder === "asc" ? "A-Z" : "Z-A"}</span>
            </button>

            <button
              onClick={() => handleSort("total_sales")}
              className="flex items-center gap-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <span>{sortOrder === "asc" ? "Low-High" : "High-Low"}</span>
            </button>
          </div>
        </motion.div>

        {/* Retailers Table */}
        <TablePlaceholder
          columns={["Retailer", "Total Sales", "Commission", "Status", "Actions"]}
          data={tableData}
          emptyMessage="No retailers found. Try adjusting your filters or search terms."
          className="animate-fade-in"
          size="lg"
        />
      </div>
    </div>
  );
}

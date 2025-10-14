import * as React from "react";
import { Search, Users, ArrowUpDown, Filter } from "lucide-react";
import { motion } from "framer-motion";

import { TablePlaceholder } from "@/components/ui/table-placeholder";
import {
  agents,
  retailers,
  sales,
  getAgentCommissionSummary,
  type Sale,
} from "@/lib/MockData";
import { cn } from "@/utils/cn";

export default function AgentRetailers() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [sortBy, setSortBy] = React.useState<string>("name");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  // Get the first active agent for demo purposes
  const agent = agents.find((a) => a.status === "active") || agents[0];

  // Get this agent's retailers
  const agentRetailers = retailers.filter((r) => r.agentId === agent.id);

  // Apply filters and sorting
  const filteredRetailers = agentRetailers
    .filter((retailer) => {
      const matchesSearch =
        retailer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        retailer.contact.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || retailer.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;

      if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === "balance") {
        comparison = a.balance - b.balance;
      } else if (sortBy === "commission") {
        comparison = a.commission - b.commission;
      } else if (sortBy === "status") {
        comparison = a.status.localeCompare(b.status);
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

  // Calculate MTD sales for each retailer
  const retailerMtdSales = React.useMemo(() => {
    // Get current month and year
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Create a map of retailer ID -> MTD sales value
    const salesMap = new Map<string, number>();

    // Process all sales
    sales.forEach((sale: Sale) => {
      const saleDate = new Date(sale.date);
      // Check if sale is in current month
      if (
        saleDate.getMonth() === currentMonth &&
        saleDate.getFullYear() === currentYear
      ) {
        const retailerId = sale.retailerId;
        // Add sale value to the retailer's total
        salesMap.set(
          retailerId,
          (salesMap.get(retailerId) || 0) + sale.voucherValue
        );
      }
    });

    return salesMap;
  }, []);

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
            {retailer.contact}
          </div>
        </div>
      </div>
    ),
    "Sales (MTD)": `R ${(retailerMtdSales.get(retailer.id) || 0).toFixed(2)}`,
    Commission: `R ${retailer.commission.toFixed(2)}`,
    Status: (
      <div className="flex items-center">
        <div
          className={cn(
            "mr-2 h-2 w-2 rounded-full",
            retailer.status === "active"
              ? "bg-green-500"
              : retailer.status === "inactive"
              ? "bg-amber-500"
              : retailer.status === "blocked"
              ? "bg-red-600"
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
          My Retailers
        </h1>
        <p className="text-muted-foreground">
          Manage and track the performance of retailers in your network.
        </p>
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
              <option value="blocked">Blocked</option>
            </select>
          </div>

          <button
            onClick={() => handleSort("name")}
            className="flex items-center gap-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <span>{sortOrder === "asc" ? "A-Z" : "Z-A"}</span>
          </button>
        </div>
      </motion.div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="text-muted-foreground">Total Retailers</div>
          <div className="mt-1 text-2xl font-semibold">
            {agentRetailers.length}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="text-muted-foreground">Active Retailers</div>
          <div className="mt-1 text-2xl font-semibold text-green-600">
            {agentRetailers.filter((r) => r.status === "active").length}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="text-muted-foreground">Total Commission</div>
          <div className="mt-1 text-2xl font-semibold text-primary">
            R{" "}
            {agentRetailers
              .reduce((sum, r) => sum + r.commission, 0)
              .toFixed(2)}
          </div>
        </div>
      </div>

      {/* Retailers Table */}
      <TablePlaceholder
        columns={["Retailer", "Sales (MTD)", "Commission", "Status", "Actions"]}
        data={tableData}
        emptyMessage="No retailers found. Try adjusting your filters or search terms."
        className="animate-fade-in"
        size="lg"
      />
    </div>
  );
}

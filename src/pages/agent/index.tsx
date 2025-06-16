import * as React from "react";
import { Users, TrendingUp, Activity, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

import { StatsTile } from "@/components/ui/stats-tile";
import { ChartPlaceholder } from "@/components/ui/chart-placeholder";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/utils/cn";
import useRequireRole from "@/hooks/useRequireRole";
import { fetchMyRetailers, fetchAgentSummary, fetchAgentStatements, type AgentStatement } from "@/actions/agentActions";
import { useAuth } from "@/hooks/useAuth";

export default function AgentDashboard() {
  // Protect this route - only allow agent role
  const { isLoading: isAuthLoading } = useRequireRole("agent");
  const { user } = useAuth();

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

  // Top performing retailers (sort by available balance)
  const topRetailers = [...retailers]
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 5);

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
          label="Commission (MTD)"
          value={`R ${summary?.mtd_commission.toFixed(2) || "0.00"}`}
          icon={TrendingUp}
          intent="success"
          subtitle={`${summary?.mtd_sales || 0} transactions`}
        />
        <StatsTile
          label="YTD Commission"
          value={`R ${summary?.ytd_commission.toFixed(2) || "0.00"}`}
          icon={Activity}
          intent="warning"
          subtitle="Year to date"
        />
      </div>

      {/* Commission Chart */}
      {/* <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <ChartPlaceholder
          title="Commission Over Time"
          description="Monthly commission earnings breakdown"
          height="lg"
        />
      </motion.div> */}

      {/* Top Retailers Carousel */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Top Performing Retailers</h2>
          <a
            href="/agent/retailers"
            className="flex items-center text-sm text-primary hover:underline"
          >
            View All
            <ChevronRight className="ml-1 h-4 w-4" />
          </a>
        </div>

        {topRetailers.length > 0 ? (
          <Carousel>
            <CarouselContent gap={16}>
              {topRetailers.map((retailer) => (
                <CarouselItem key={retailer.id} width="300px">
                  <motion.div
                    whileHover={{ y: -5 }}
                    className="flex h-full flex-col rounded-lg border border-border bg-card p-5 shadow-sm"
                  >
                    <div className="mb-2 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        {retailer.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-medium line-clamp-1">
                          {retailer.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {retailer.location}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between border-t border-border pt-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Balance</p>
                        <p className="font-semibold">
                          R {retailer.balance.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Commission</p>
                        <p className="font-semibold">
                          R {retailer.commission_balance.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
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
                        <span className="text-xs capitalize">
                          {retailer.status}
                        </span>
                      </div>
                      <a
                        href={`/agent/retailers/${retailer.id}`}
                        className="rounded-md px-2.5 py-1 text-xs text-primary hover:bg-primary/10"
                      >
                        View Details
                      </a>
                    </div>
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        ) : (
          <div className="rounded-lg border border-border bg-card p-10 text-center">
            <p className="text-muted-foreground">
              No retailers found. Add some retailers to get started.
            </p>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      {/* <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Recent Activity</h2>

        <div className="space-y-4">
          {statements.slice(0, 3).map((statement: AgentStatement) => (
            <div key={statement.id} className="flex items-center gap-4 rounded-lg bg-muted/40 p-3">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full",
                statement.type === "commission_credit" ? "bg-green-500/10 text-green-500" :
                statement.type === "commission_payout" ? "bg-amber-500/10 text-amber-500" :
                "bg-blue-500/10 text-blue-500"
              )}>
                {statement.type === "commission_credit" ? (
                  <TrendingUp className="h-5 w-5" />
                ) : statement.type === "commission_payout" ? (
                  <Activity className="h-5 w-5" />
                ) : (
                  <Users className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-medium capitalize">
                  {statement.type.replace(/_/g, " ")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {statement.retailer_name ? `From ${statement.retailer_name}` : statement.notes}
                </p>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                {new Date(statement.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <button className="inline-flex items-center text-sm text-primary hover:underline">
            View All Activity
            <ChevronRight className="ml-1 h-4 w-4" />
          </button>
        </div>
      </div> */}
    </div>
  );
}

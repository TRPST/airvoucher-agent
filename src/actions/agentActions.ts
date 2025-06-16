import { supabase } from "@/utils/supabase/client";
import { PostgrestError } from "@supabase/supabase-js";

export type AgentRetailer = {
  id: string;
  name: string;
  status: "active" | "suspended" | "inactive";
  balance: number;
  commission_balance: number;
  location?: string;
  sales_count?: number;
  commission_earned?: number;
};

export type AgentStatement = {
  id: string;
  created_at: string;
  type: string;
  amount: number;
  balance_after: number;
  retailer_name?: string;
  notes?: string;
};

export type AgentSummary = {
  retailer_count: number;
  mtd_sales: number;
  mtd_commission: number;
  ytd_commission: number;
};

/**
 * Fetch retailers assigned to an agent
 */
export async function fetchMyRetailers(agentId: string): Promise<{
  data: AgentRetailer[] | null;
  error: PostgrestError | Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from("retailers")
      .select(
        `
        id,
        name,
        status,
        balance,
        commission_balance,
        location
      `
      )
      .eq("agent_profile_id", agentId);

    if (error) {
      console.error("Error fetching agent retailers:", error);
      return { data: null, error };
    }

    if (!data || data.length === 0) {
      return { data: [], error: null };
    }

    // For each retailer, we'll add their monthly sales count and commission
    const result: AgentRetailer[] = [];
    const now = new Date();
    const firstDayOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    ).toISOString();

    for (const retailer of data) {
      try {
        // Get sales for this retailer in the current month
        const { data: salesData, error: salesError } = await supabase
          .from("sales")
          .select(
            `
            id,
            agent_commission,
            terminals!inner(retailer_id)
          `
          )
          .eq("terminals.retailer_id", retailer.id)
          .gte("created_at", firstDayOfMonth);

        if (salesError) {
          console.warn(
            `Error fetching sales for retailer ${retailer.id}:`,
            salesError
          );
        }

        result.push({
          ...retailer,
          sales_count: salesData?.length || 0,
          commission_earned:
            salesData?.reduce(
              (sum, sale) => sum + (sale.agent_commission || 0),
              0
            ) || 0,
        });
      } catch (err) {
        console.error(`Error processing retailer ${retailer.id}:`, err);
        result.push({
          ...retailer,
          sales_count: 0,
          commission_earned: 0,
        });
      }
    }

    return { data: result, error: null };
  } catch (err) {
    console.error("Unexpected error in fetchMyRetailers:", err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Fetch agent statements (transactions) with optional date filtering
 */
export async function fetchAgentStatements(
  agentId: string,
  { startDate, endDate }: { startDate?: string; endDate?: string }
): Promise<{
  data: AgentStatement[] | null;
  error: PostgrestError | Error | null;
}> {
  try {
    let query = supabase
      .from("transactions")
      .select(
        `
        id,
        created_at,
        type,
        amount,
        balance_after,
        notes,
        retailers(name)
      `
      )
      .eq("agent_profile_id", agentId);

    if (startDate) {
      query = query.gte("created_at", startDate);
    }

    if (endDate) {
      query = query.lte("created_at", endDate);
    }

    // Order by newest first
    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching agent statements:", error);
      return { data: null, error };
    }

    if (!data || data.length === 0) {
      return { data: [], error: null };
    }

    // Transform the data to match the AgentStatement type
    const statements = data.map((statement) => ({
      id: statement.id,
      created_at: statement.created_at,
      type: statement.type,
      amount: statement.amount,
      balance_after: statement.balance_after,
      retailer_name: statement.retailers?.[0]?.name,
      notes: statement.notes,
    }));

    return { data: statements, error: null };
  } catch (err) {
    console.error("Unexpected error in fetchAgentStatements:", err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Fetch agent summary statistics
 */
export async function fetchAgentSummary(agentId: string): Promise<{
  data: AgentSummary | null;
  error: PostgrestError | Error | null;
}> {
  try {
    // Get current month's start date
    const now = new Date();
    const firstDayOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    ).toISOString();
    
    // Get first day of year
    const firstDayOfYear = new Date(
      now.getFullYear(),
      0,
      1
    ).toISOString();

    // Get retailer count
    const { count: retailerCount, error: retailerError } = await supabase
      .from("retailers")
      .select("*", { count: "exact", head: true })
      .eq("agent_profile_id", agentId);

    if (retailerError) {
      console.error("Error fetching retailer count:", retailerError);
      return { data: null, error: retailerError };
    }

    // Get MTD sales and commission
    const { data: mtdData, error: mtdError } = await supabase
      .from("sales")
      .select(
        `
        id,
        agent_commission,
        terminals!inner(retailer_id)
      `
      )
      .eq("terminals.retailers.agent_profile_id", agentId)
      .gte("created_at", firstDayOfMonth);

    if (mtdError) {
      console.error("Error fetching MTD data:", mtdError);
      return { data: null, error: mtdError };
    }

    // Get YTD commission
    const { data: ytdData, error: ytdError } = await supabase
      .from("sales")
      .select(
        `
        id,
        agent_commission,
        terminals!inner(retailer_id)
      `
      )
      .eq("terminals.retailers.agent_profile_id", agentId)
      .gte("created_at", firstDayOfYear);

    if (ytdError) {
      console.error("Error fetching YTD data:", ytdError);
      return { data: null, error: ytdError };
    }

    const summary: AgentSummary = {
      retailer_count: retailerCount || 0,
      mtd_sales: mtdData?.length || 0,
      mtd_commission: mtdData?.reduce(
        (sum, sale) => sum + (sale.agent_commission || 0),
        0
      ) || 0,
      ytd_commission: ytdData?.reduce(
        (sum, sale) => sum + (sale.agent_commission || 0),
        0
      ) || 0,
    };

    return { data: summary, error: null };
  } catch (err) {
    console.error("Unexpected error in fetchAgentSummary:", err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
} 
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
  total_sales?: number;
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

// New types for detailed retailer data
export type RetailerDetail = {
  id: string;
  name: string;
  email: string | null;
  contact_number: string | null;
  contact_name: string | null;
  status: "active" | "suspended" | "inactive";
  balance: number;
  commission_balance: number;
  location?: string;
  created_at: string;
  agent_profile_id: string;
  terminals: RetailerTerminal[];
};

export type RetailerTerminal = {
  id: string;
  name: string;
  status: "active" | "inactive";
  last_active: string;
  retailer_id: string;
};

export type RetailerSale = {
  id: string;
  created_at: string;
  sale_amount: number;
  agent_commission: number;
  voucher_type: string;
  terminal_name?: string;
};

export type RetailerSalesSummary = {
  today_count: number;
  today_value: number;
  mtd_count: number;
  mtd_value: number;
  total_count: number;
  total_value: number;
  total_commission: number;
};

type Sale = {
  agent_commission: number;
};

type Statement = {
  amount: number;
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
            sale_amount,
            agent_commission,
            terminals!inner(retailer_id)
          `
          )
          .eq("terminals.retailer_id", retailer.id);

        if (salesError) {
          console.warn(
            `Error fetching sales for retailer ${retailer.id}:`,
            salesError
          );
        }

        const totalSales = salesData?.reduce((sum, sale) => sum + (sale.sale_amount || 0), 0) || 0;

        result.push({
          ...retailer,
          sales_count: salesData?.length || 0,
          commission_earned:
            salesData?.reduce(
              (sum, sale) => sum + (sale.agent_commission || 0),
              0
            ) || 0,
          total_sales: totalSales,
        });
      } catch (err) {
        console.error(`Error processing retailer ${retailer.id}:`, err);
        result.push({
          ...retailer,
          sales_count: 0,
          commission_earned: 0,
          total_sales: 0,
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
  data: {
    retailer_count: number;
    mtd_sales: number;
    mtd_commission: number;
    ytd_commission: number;
    total_commission: number;
    paid_commission: number;
  } | null;
  error: PostgrestError | Error | null;
}> {
  try {
    console.log("Fetching performance summary for agent:", agentId);

    // In development, return mock data for testing
    // if (process.env.NODE_ENV === "development") {
    //   console.log("Returning mock summary data for development");
    //   return {
    //     data: {
    //       retailer_count: 3,
    //       mtd_sales: 12,
    //       mtd_commission: 240,
    //       ytd_commission: 1250,
    //       total_commission: 5000,
    //       paid_commission: 3750,
    //     },
    //     error: null,
    //   };
    // }

    // Get count of retailers assigned to this agent
    const { data: retailers, error: retailersError } = await supabase
      .from("retailers")
      .select("id", { count: "exact" })
      .eq("agent_profile_id", agentId);

    if (retailersError) {
      console.error("Error counting retailers:", retailersError);
      return { data: null, error: retailersError };
    }

    // Get current date ranges
    const now = new Date();
    const firstDayOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    ).toISOString();
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1).toISOString();

    // Get MTD sales and commissions
    const { data: mtdData, error: mtdError } = await supabase
      .from("sales")
      .select(
        `
        id,
        sale_amount,
        agent_commission
      `
      )
      .eq("agent_profile_id", agentId)
      .gte("created_at", firstDayOfMonth);

    if (mtdError) {
      console.error("Error fetching MTD data:", mtdError);
      return { data: null, error: mtdError };
    }

    // Get YTD commissions
    const { data: ytdData, error: ytdError } = await supabase
      .from("sales")
      .select("agent_commission")
      .eq("agent_profile_id", agentId)
      .gte("created_at", firstDayOfYear);

    if (ytdError) {
      console.error("Error fetching YTD data:", ytdError);
      return { data: null, error: ytdError };
    }

    // Get total commissions (all time)
    const { data: totalData, error: totalError } = await supabase
      .from("sales")
      .select("agent_commission")
      .eq("agent_profile_id", agentId);

    if (totalError) {
      console.error("Error fetching total commission data:", totalError);
      return { data: null, error: totalError };
    }

    // Get paid commissions
    const { data: paidData, error: paidError } = await supabase
      .from("agent_statements")
      .select("amount")
      .eq("agent_profile_id", agentId)
      .eq("type", "commission_payout");

    if (paidError) {
      console.error("Error fetching paid commission data:", paidError);
      return { data: null, error: paidError };
    }

    // Calculate summary metrics
    const mtd_sales = mtdData?.length || 0;
    const mtd_commission =
      mtdData?.reduce((sum: number, sale: Sale) => sum + (sale.agent_commission || 0), 0) ||
      0;
    const ytd_commission =
      ytdData?.reduce((sum: number, sale: Sale) => sum + (sale.agent_commission || 0), 0) ||
      0;
    const total_commission =
      totalData?.reduce((sum: number, sale: Sale) => sum + (sale.agent_commission || 0), 0) ||
      0;
    const paid_commission =
      paidData?.reduce((sum: number, statement: Statement) => sum + (statement.amount || 0), 0) ||
      0;

    const summary = {
      retailer_count: retailers?.length || 0,
      mtd_sales,
      mtd_commission,
      ytd_commission,
      total_commission,
      paid_commission,
    };

    console.log("Agent summary:", summary);
    return { data: summary, error: null };
  } catch (err) {
    console.error("Unexpected error in fetchAgentSummary:", err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Fetch detailed retailer information by ID
 */
export async function fetchRetailerDetail(
  retailerId: string,
  agentId: string
): Promise<{
  data: RetailerDetail | null;
  error: PostgrestError | Error | null;
}> {
  try {
    // First verify this retailer belongs to the agent
    const { data: retailer, error: retailerError } = await supabase
      .from("retailers")
      .select(
        `
        id,
        name,
        contact_name,
        contact_email,
        contact_number,
        status,
        balance,
        commission_balance,
        location,
        created_at,
        agent_profile_id
      `
      )
      .eq("id", retailerId)
      .eq("agent_profile_id", agentId)
      .single();

    if (retailerError) {
      console.error("Error fetching retailer:", retailerError);
      return { data: null, error: retailerError };
    }

    if (!retailer) {
      return { data: null, error: new Error("Retailer not found") };
    }

    // Get terminals for this retailer
    const { data: terminals, error: terminalsError } = await supabase
      .from("terminals")
      .select(
        `
        id,
        name,
        status,
        last_active,
        retailer_id
      `
      )
      .eq("retailer_id", retailerId);

    if (terminalsError) {
      console.error("Error fetching terminals:", terminalsError);
      return { data: null, error: terminalsError };
    }

    const retailerDetail: RetailerDetail = {
      ...retailer,
      email: retailer.contact_email,
      terminals: terminals || [],
    };

    return { data: retailerDetail, error: null };
  } catch (err) {
    console.error("Unexpected error in fetchRetailerDetail:", err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Fetch recent sales for a retailer
 */
export async function fetchRetailerSales(
  retailerId: string,
  limit: number = 10
): Promise<{
  data: RetailerSale[] | null;
  error: PostgrestError | Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from("sales")
      .select(
        `
        id,
        created_at,
        sale_amount,
        agent_commission,
        terminals!inner(name),
        voucher_inventory!inner(voucher_types!inner(name))
      `
      )
      .eq("terminals.retailer_id", retailerId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching retailer sales:", error);
      return { data: null, error };
    }

    if (!data || data.length === 0) {
      return { data: [], error: null };
    }

    // Transform the data to match RetailerSale type
    const sales = data.map((sale: any) => {
      const t = Array.isArray(sale.terminals)
        ? sale.terminals[0]
        : sale.terminals;
      const voucherInventory = sale.voucher_inventory;
      const voucherType = voucherInventory?.voucher_types;

      return {
        ...sale,
        voucher_type: voucherType?.name || "N/A",
        terminal_name: t?.name,
      };
    });

    return { data: sales, error: null };
  } catch (err) {
    console.error("Unexpected error in fetchRetailerSales:", err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Fetch sales summary for a retailer
 */
export async function fetchRetailerSalesSummary(
  retailerId: string
): Promise<{
  data: RetailerSalesSummary | null;
  error: PostgrestError | Error | null;
}> {
  try {
    // Get current date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Get today's sales
    const { data: todayData, error: todayError } = await supabase
      .from("sales")
      .select("sale_amount, terminals!inner(retailer_id)")
      .eq("terminals.retailer_id", retailerId)
      .gte("created_at", today);

    if (todayError) {
      console.error("Error fetching today's sales:", todayError);
      return { data: null, error: todayError };
    }

    // Get MTD sales
    const { data: mtdData, error: mtdError } = await supabase
      .from("sales")
      .select("sale_amount, terminals!inner(retailer_id)")
      .eq("terminals.retailer_id", retailerId)
      .gte("created_at", firstDayOfMonth);

    if (mtdError) {
      console.error("Error fetching MTD sales:", mtdError);
      return { data: null, error: mtdError };
    }

    // Get total sales (all time)
    const { data: totalData, error: totalError } = await supabase
      .from("sales")
      .select("sale_amount, agent_commission, terminals!inner(retailer_id)")
      .eq("terminals.retailer_id", retailerId);

    if (totalError) {
      console.error("Error fetching total sales:", totalError);
      return { data: null, error: totalError };
    }

    // Calculate summary metrics
    const today_count = todayData?.length || 0;
    const today_value = todayData?.reduce((sum, sale) => sum + (sale.sale_amount || 0), 0) || 0;
    const mtd_count = mtdData?.length || 0;
    const mtd_value =
      mtdData?.reduce((sum, sale) => sum + (sale.sale_amount || 0), 0) || 0;
    const total_count = totalData?.length || 0;
    const total_value =
      totalData?.reduce((sum, sale) => sum + (sale.sale_amount || 0), 0) || 0;
    const total_commission =
      totalData?.reduce((sum, sale) => sum + (sale.agent_commission || 0), 0) ||
      0;

    const summary: RetailerSalesSummary = {
      today_count,
      today_value,
      mtd_count,
      mtd_value,
      total_count,
      total_value,
      total_commission,
    };

    return { data: summary, error: null };
  } catch (err) {
    console.error("Unexpected error in fetchRetailerSalesSummary:", err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
} 
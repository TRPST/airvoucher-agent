import { supabase } from "@/utils/supabase/client";
import { PostgrestError } from "@supabase/supabase-js";

export type AgentRetailer = {
  id: string;
  name: string;
  status: "active" | "suspended" | "inactive" | "blocked";
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
  status: "active" | "suspended" | "inactive" | "blocked";
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
    total_commission: number;
    paid_commission: number;
  } | null;
  error: PostgrestError | Error | null;
}> {
  try {
    console.log("Fetching performance summary for agent:", agentId);

    const { data, error } = await supabase.rpc("get_agent_summary", {
      p_agent_id: agentId,
    });

    if (error) {
      console.error("Error fetching agent summary:", error);
      return { data: null, error };
    }

    // The RPC returns an array, so we take the first element.
    const summary = data && data.length > 0 ? data[0] : null;

    if (!summary) {
      return {
        data: {
          retailer_count: 0,
          total_commission: 0,
          paid_commission: 0,
        },
        error: null,
      };
    }

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

/**
 * Update a retailer's status for the current agent
 */
export async function updateRetailerStatus(
  agentId: string,
  retailerId: string,
  status: AgentRetailer["status"]
): Promise<{
  error: PostgrestError | Error | null;
}> {
  if (!agentId) {
    return { error: new Error("Missing agent identifier") };
  }

  try {
    const { error } = await supabase
      .from("retailers")
      .update({ status })
      .eq("id", retailerId)
      .eq("agent_profile_id", agentId);

    if (error) {
      console.error("Error updating retailer status:", error);
      return { error };
    }

    return { error: null };
  } catch (err) {
    console.error("Unexpected error updating retailer status:", err);
    return {
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

export type CommissionStatement = {
  stats: {
    total_commission: number;
    paid_commission: number;
    pending_commission: number;
    transaction_count: number;
  };
  pending_transactions: any[];
  paid_transactions: any[];
};

export type BankAccount = {
  id: string;
  profile_id: string;
  bank_name: string;
  account_holder: string;
  account_number: string;
  branch_code?: string;
  account_type: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
};

export type BankAccountInput = {
  bank_name: string;
  account_holder: string;
  account_number: string;
  branch_code?: string;
  account_type: string;
};

export async function fetchCommissionStatement(
  agentId: string,
  { startDate, endDate }: { startDate: string; endDate: string }
): Promise<{
  data: CommissionStatement | null;
  error: PostgrestError | Error | null;
}> {
  try {
    const { data, error } = await supabase.rpc("get_agent_commission_statement", {
      p_agent_id: agentId,
      p_start_date: startDate,
      p_end_date: endDate,
    });

    if (error) {
      console.error("Error fetching commission statement:", error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error("Unexpected error in fetchCommissionStatement:", err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Fetch bank account information for an agent
 */
export async function fetchBankAccount(profileId: string): Promise<{
  data: BankAccount | null;
  error: PostgrestError | Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from("bank_accounts")
      .select("*")
      .eq("profile_id", profileId)
      .eq("is_primary", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned - no bank account exists yet
        return { data: null, error: null };
      }
      console.error("Error fetching bank account:", error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error("Unexpected error in fetchBankAccount:", err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Save or update bank account information for an agent
 */
export async function saveBankAccount(
  profileId: string,
  bankData: BankAccountInput
): Promise<{
  data: BankAccount | null;
  error: PostgrestError | Error | null;
}> {
  try {
    // First, check if a bank account already exists for this profile
    const { data: existingAccount, error: fetchError } = await supabase
      .from("bank_accounts")
      .select("id")
      .eq("profile_id", profileId)
      .eq("is_primary", true)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error checking existing bank account:", fetchError);
      return { data: null, error: fetchError };
    }

    let result;
    if (existingAccount) {
      // Update existing bank account
      const { data, error } = await supabase
        .from("bank_accounts")
        .update({
          bank_name: bankData.bank_name,
          account_holder: bankData.account_holder,
          account_number: bankData.account_number,
          branch_code: bankData.branch_code,
          account_type: bankData.account_type,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingAccount.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating bank account:", error);
        return { data: null, error };
      }

      result = data;
    } else {
      // Insert new bank account
      const { data, error } = await supabase
        .from("bank_accounts")
        .insert({
          profile_id: profileId,
          bank_name: bankData.bank_name,
          account_holder: bankData.account_holder,
          account_number: bankData.account_number,
          branch_code: bankData.branch_code,
          account_type: bankData.account_type,
          is_primary: true,
        })
        .select()
        .single();

      if (error) {
        console.error("Error inserting bank account:", error);
        return { data: null, error };
      }

      result = data;
    }

    return { data: result, error: null };
  } catch (err) {
    console.error("Unexpected error in saveBankAccount:", err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
} 

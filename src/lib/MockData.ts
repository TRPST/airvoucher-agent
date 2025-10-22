// Types for our data models
export type Retailer = {
  id: string;
  name: string;
  contact: string;
  email: string;
  balance: number;
  credit: number;
  commission: number;
  status: "active" | "inactive" | "suspended" | "blocked";
  agentId: string;
  commissionGroupId: string;
  createdAt: string;
  terminals: Terminal[];
};

export type Terminal = {
  id: string;
  name: string;
  retailerId: string;
  lastActive: string;
  status: "active" | "inactive";
};

export type Agent = {
  id: string;
  name: string;
  email: string;
  phone: string;
  retailers: number;
  commission: number;
  status: "active" | "inactive";
  createdAt: string;
};

export type Voucher = {
  id: string;
  type: "Mobile" | "OTT" | "Hollywoodbets" | "Ringa" | "EasyLoad";
  provider: string;
  value: number;
  cost: number;
  stock: number;
  sold: number;
};

export type Sale = {
  id: string;
  date: string;
  retailerId: string;
  voucherId: string;
  voucherType: string;
  voucherValue: number;
  pin?: string;
  serialNumber?: string;
  agentCommission: number;
  retailerCommission: number;
  platformCommission: number;
};

export type CommissionGroup = {
  id: string;
  name: string;
  mobileRate: number;
  ottRate: number;
  hollywoodbetsRate: number;
  ringaRate: number;
  easyloadRate: number;
};

// Mock data for retailers
export const retailers: Retailer[] = [
  {
    id: "r1",
    name: "Soweto Corner Shop",
    contact: "John Dube",
    email: "john@sowetomarket.co.za",
    balance: 3500,
    credit: 1000,
    commission: 450,
    status: "active",
    agentId: "a1",
    commissionGroupId: "cg1",
    createdAt: "2025-01-10T08:30:00Z",
    terminals: [
      {
        id: "t1",
        name: "Counter 1",
        retailerId: "r1",
        lastActive: "2025-05-02T10:15:00Z",
        status: "active",
      },
      {
        id: "t2",
        name: "Counter 2",
        retailerId: "r1",
        lastActive: "2025-05-01T16:45:00Z",
        status: "active",
      },
    ],
  },
  {
    id: "r2",
    name: "Alex Mini Mart",
    contact: "Sarah Nkosi",
    email: "sarah@alexminimart.co.za",
    balance: 1200,
    credit: 500,
    commission: 220,
    status: "active",
    agentId: "a2",
    commissionGroupId: "cg2",
    createdAt: "2025-01-15T10:45:00Z",
    terminals: [
      {
        id: "t3",
        name: "Main POS",
        retailerId: "r2",
        lastActive: "2025-05-02T09:30:00Z",
        status: "active",
      },
    ],
  },
  {
    id: "r3",
    name: "Sandton Convenience",
    contact: "Michael Patel",
    email: "michael@sandtonconv.co.za",
    balance: 7800,
    credit: 2000,
    commission: 890,
    status: "active",
    agentId: "a1",
    commissionGroupId: "cg1",
    createdAt: "2025-02-05T14:20:00Z",
    terminals: [
      {
        id: "t4",
        name: "Terminal 1",
        retailerId: "r3",
        lastActive: "2025-05-02T12:10:00Z",
        status: "active",
      },
      {
        id: "t5",
        name: "Terminal 2",
        retailerId: "r3",
        lastActive: "2025-05-02T11:05:00Z",
        status: "active",
      },
    ],
  },
  {
    id: "r4",
    name: "Cape Township Spaza",
    contact: "Grace Ndlovu",
    email: "grace@capespaza.co.za",
    balance: 950,
    credit: 0,
    commission: 125,
    status: "active",
    agentId: "a3",
    commissionGroupId: "cg2",
    createdAt: "2025-02-18T09:15:00Z",
    terminals: [
      {
        id: "t6",
        name: "Main Terminal",
        retailerId: "r4",
        lastActive: "2025-05-01T15:40:00Z",
        status: "active",
      },
    ],
  },
  {
    id: "r5",
    name: "Durban Beach Shop",
    contact: "Ahmed Ismail",
    email: "ahmed@durbanbeach.co.za",
    balance: 4200,
    credit: 800,
    commission: 510,
    status: "active",
    agentId: "a2",
    commissionGroupId: "cg1",
    createdAt: "2025-03-01T11:30:00Z",
    terminals: [
      {
        id: "t7",
        name: "POS 1",
        retailerId: "r5",
        lastActive: "2025-05-02T14:20:00Z",
        status: "active",
      },
      {
        id: "t8",
        name: "POS 2",
        retailerId: "r5",
        lastActive: "2025-05-02T10:00:00Z",
        status: "inactive",
      },
    ],
  },
  {
    id: "r6",
    name: "Pretoria Central Kiosk",
    contact: "David van Wyk",
    email: "david@pretoriakiosk.co.za",
    balance: 0,
    credit: 0,
    commission: 0,
    status: "suspended",
    agentId: "a1",
    commissionGroupId: "cg2",
    createdAt: "2025-01-25T08:45:00Z",
    terminals: [
      {
        id: "t9",
        name: "Main Kiosk",
        retailerId: "r6",
        lastActive: "2025-04-15T09:30:00Z",
        status: "inactive",
      },
    ],
  },
];

// Mock data for agents
export const agents: Agent[] = [
  {
    id: "a1",
    name: "Themba Khumalo",
    email: "themba@airvoucher.co.za",
    phone: "087 123 4567",
    retailers: 3,
    commission: 1340,
    status: "active",
    createdAt: "2025-01-05T08:00:00Z",
  },
  {
    id: "a2",
    name: "Precious Moloi",
    email: "precious@airvoucher.co.za",
    phone: "087 234 5678",
    retailers: 2,
    commission: 730,
    status: "active",
    createdAt: "2025-01-08T09:15:00Z",
  },
  {
    id: "a3",
    name: "Trevor Dlamini",
    email: "trevor@airvoucher.co.za",
    phone: "087 345 6789",
    retailers: 1,
    commission: 125,
    status: "active",
    createdAt: "2025-02-01T10:30:00Z",
  },
  {
    id: "a4",
    name: "Lisa van Niekerk",
    email: "lisa@airvoucher.co.za",
    phone: "087 456 7890",
    retailers: 0,
    commission: 0,
    status: "inactive",
    createdAt: "2025-03-15T11:45:00Z",
  },
];

// Mock data for vouchers
export const vouchers: Voucher[] = [
  // Mobile
  {
    id: "v1",
    type: "Mobile",
    provider: "Vodacom",
    value: 10,
    cost: 9.5,
    stock: 5000,
    sold: 1250,
  },
  {
    id: "v2",
    type: "Mobile",
    provider: "Vodacom",
    value: 20,
    cost: 19,
    stock: 3000,
    sold: 950,
  },
  {
    id: "v3",
    type: "Mobile",
    provider: "Vodacom",
    value: 50,
    cost: 47.5,
    stock: 2000,
    sold: 780,
  },
  {
    id: "v4",
    type: "Mobile",
    provider: "MTN",
    value: 10,
    cost: 9.5,
    stock: 4500,
    sold: 1150,
  },
  {
    id: "v5",
    type: "Mobile",
    provider: "MTN",
    value: 30,
    cost: 28.5,
    stock: 2500,
    sold: 920,
  },
  {
    id: "v6",
    type: "Mobile",
    provider: "Cell C",
    value: 10,
    cost: 9.5,
    stock: 3000,
    sold: 850,
  },
  {
    id: "v7",
    type: "Mobile",
    provider: "Telkom",
    value: 20,
    cost: 19,
    stock: 2000,
    sold: 650,
  },

  // OTT
  {
    id: "v8",
    type: "OTT",
    provider: "Netflix",
    value: 99,
    cost: 94,
    stock: 1500,
    sold: 420,
  },
  {
    id: "v9",
    type: "OTT",
    provider: "Showmax",
    value: 69,
    cost: 65.5,
    stock: 1200,
    sold: 350,
  },
  {
    id: "v10",
    type: "OTT",
    provider: "DSTV Stream",
    value: 129,
    cost: 122.5,
    stock: 1000,
    sold: 280,
  },

  // Hollywoodbets
  {
    id: "v11",
    type: "Hollywoodbets",
    provider: "Hollywoodbets",
    value: 50,
    cost: 50,
    stock: 3000,
    sold: 950,
  },
  {
    id: "v12",
    type: "Hollywoodbets",
    provider: "Hollywoodbets",
    value: 100,
    cost: 100,
    stock: 2500,
    sold: 870,
  },
  {
    id: "v13",
    type: "Hollywoodbets",
    provider: "Hollywoodbets",
    value: 200,
    cost: 200,
    stock: 1500,
    sold: 630,
  },

  // Ringa
  {
    id: "v14",
    type: "Ringa",
    provider: "Ringa",
    value: 20,
    cost: 19,
    stock: 2000,
    sold: 450,
  },
  {
    id: "v15",
    type: "Ringa",
    provider: "Ringa",
    value: 50,
    cost: 47.5,
    stock: 1500,
    sold: 320,
  },

  // EasyLoad
  {
    id: "v16",
    type: "EasyLoad",
    provider: "EasyLoad",
    value: 50,
    cost: 47.5,
    stock: 2000,
    sold: 580,
  },
  {
    id: "v17",
    type: "EasyLoad",
    provider: "EasyLoad",
    value: 100,
    cost: 95,
    stock: 1500,
    sold: 420,
  },
  {
    id: "v18",
    type: "EasyLoad",
    provider: "EasyLoad",
    value: 200,
    cost: 190,
    stock: 1000,
    sold: 290,
  },
];

// Mock data for sales
export const generateSales = (): Sale[] => {
  const sales: Sale[] = [];
  const startDate = new Date("2025-04-01T00:00:00Z");
  const endDate = new Date("2025-05-02T23:59:59Z");

  for (let i = 0; i < 100; i++) {
    const saleDate = new Date(
      startDate.getTime() +
        Math.random() * (endDate.getTime() - startDate.getTime())
    );
    const retailer = retailers[Math.floor(Math.random() * retailers.length)];
    const voucher = vouchers[Math.floor(Math.random() * vouchers.length)];
    const agent = agents.find(
      (a) => a.id === (retailer.status === "active" ? retailer.agentId : "a1")
    );

    const platformCommissionRate = 0.02; // 2%
    const agentCommissionRate = 0.01; // 1%
    const retailerCommissionRate = 0.02; // 2%

    const platformCommission = voucher.value * platformCommissionRate;
    const agentCommission = voucher.value * agentCommissionRate;
    const retailerCommission = voucher.value * retailerCommissionRate;

    sales.push({
      id: `s${i + 1}`,
      date: saleDate.toISOString(),
      retailerId: retailer.id,
      voucherId: voucher.id,
      voucherType: voucher.type,
      voucherValue: voucher.value,
      pin: `${Math.floor(1000000 + Math.random() * 9000000)}`,
      serialNumber: `SN${Math.floor(10000000 + Math.random() * 90000000)}`,
      agentCommission,
      retailerCommission,
      platformCommission,
    });
  }

  // Sort sales by date (newest first)
  return sales.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};

export const sales = generateSales();

// Mock data for commission groups
export const commissionGroups: CommissionGroup[] = [
  {
    id: "cg1",
    name: "Premium",
    mobileRate: 0.03, // 3%
    ottRate: 0.025, // 2.5%
    hollywoodbetsRate: 0.02, // 2%
    ringaRate: 0.025, // 2.5%
    easyloadRate: 0.02, // 2%
  },
  {
    id: "cg2",
    name: "Standard",
    mobileRate: 0.02, // 2%
    ottRate: 0.015, // 1.5%
    hollywoodbetsRate: 0.01, // 1%
    ringaRate: 0.015, // 1.5%
    easyloadRate: 0.01, // 1%
  },
  {
    id: "cg3",
    name: "Basic",
    mobileRate: 0.01, // 1%
    ottRate: 0.01, // 1%
    hollywoodbetsRate: 0.005, // 0.5%
    ringaRate: 0.01, // 1%
    easyloadRate: 0.005, // 0.5%
  },
];

// Helper functions
export const getTodaySales = (): Sale[] => {
  const today = new Date().toISOString().split("T")[0];
  return sales.filter((sale) => sale.date.startsWith(today));
};

export const getRetailerById = (id: string): Retailer | undefined => {
  return retailers.find((retailer) => retailer.id === id);
};

export const getAgentById = (id: string): Agent | undefined => {
  return agents.find((agent) => agent.id === id);
};

export const getVoucherById = (id: string): Voucher | undefined => {
  return vouchers.find((voucher) => voucher.id === id);
};

export const getRetailersByAgentId = (agentId: string): Retailer[] => {
  return retailers.filter((retailer) => retailer.agentId === agentId);
};

export const getSalesByRetailerId = (retailerId: string): Sale[] => {
  return sales.filter((sale) => sale.retailerId === retailerId);
};

export const getCommissionGroupById = (
  id: string
): CommissionGroup | undefined => {
  return commissionGroups.find((group) => group.id === id);
};

// Get terminals for a retailer (added for TerminalSelector component)
export const getMockTerminals = (retailerId?: string): Terminal[] => {
  if (retailerId) {
    const retailer = getRetailerById(retailerId);
    return retailer ? retailer.terminals : [];
  }

  // If no retailerId is provided, get the first active retailer's terminals
  const activeRetailer = retailers.find((r) => r.status === "active");
  return activeRetailer ? activeRetailer.terminals : [];
};

export const getRetailerSalesSummary = (retailerId: string) => {
  const retailerSales = getSalesByRetailerId(retailerId);

  const today = new Date().toISOString().split("T")[0];
  const todaySales = retailerSales.filter((sale) =>
    sale.date.startsWith(today)
  );

  const totalSales = retailerSales.length;
  const totalValue = retailerSales.reduce(
    (sum, sale) => sum + sale.voucherValue,
    0
  );
  const todayValue = todaySales.reduce(
    (sum, sale) => sum + sale.voucherValue,
    0
  );
  const todayCount = todaySales.length;

  return {
    totalSales,
    totalValue,
    todayValue,
    todayCount,
  };
};

export const getAgentCommissionSummary = (agentId: string) => {
  const agentRetailers = getRetailersByAgentId(agentId);
  const retailerIds = agentRetailers.map((retailer) => retailer.id);

  const allSales = sales.filter((sale) =>
    retailerIds.includes(sale.retailerId)
  );

  // Calculate month to date
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const mtdSales = allSales.filter((sale) => {
    const saleDate = new Date(sale.date);
    return (
      saleDate.getMonth() === currentMonth &&
      saleDate.getFullYear() === currentYear
    );
  });

  const mtdCommission = mtdSales.reduce(
    (sum, sale) => sum + sale.agentCommission,
    0
  );

  // Calculate previous month
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const prevMonthSales = allSales.filter((sale) => {
    const saleDate = new Date(sale.date);
    return (
      saleDate.getMonth() === prevMonth &&
      saleDate.getFullYear() === prevMonthYear
    );
  });

  const prevMonthCommission = prevMonthSales.reduce(
    (sum, sale) => sum + sale.agentCommission,
    0
  );

  return {
    mtdCommission,
    prevMonthCommission,
    mtdSalesCount: mtdSales.length,
    prevMonthSalesCount: prevMonthSales.length,
  };
};

import * as React from "react";
import { User, Mail, Phone, Building, CreditCard } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/components/Layout";
import useRequireRole from "@/hooks/useRequireRole";
import { fetchBankAccount } from "@/actions/agentActions";

export default function AgentProfile() {
  const { user, profile } = useAuth();
  const { isLoading: isAuthLoading } = useRequireRole("agent");

  // Fetch bank account data
  const { data: bankAccountData, isLoading: isBankLoading } = useQuery({
    queryKey: ["bank-account", profile?.id],
    queryFn: () => fetchBankAccount(profile?.id || ""),
    enabled: !!profile?.id,
  });

  if (isAuthLoading || isBankLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  const pageProfile = {
    name: profile?.full_name || user?.email || "Agent Name",
    email: user?.email,
    phone: profile?.phone_number || "+27 82 000 0000",
    businessName: profile?.business_name || "Agent Business Name", // This should come from agent data
    bankDetails: {
      bankName: bankAccountData?.data?.bank_name || "Not provided",
      accountNumber: bankAccountData?.data?.account_number || "Not provided",
      branchCode: bankAccountData?.data?.branch_code || "Not provided",
      accountType: bankAccountData?.data?.account_type || "Not provided",
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Agent Profile
        </h1>
        <p className="text-muted-foreground">
          View and manage your agent details.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Personal Details */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium">Personal Details</h2>
            <button className="rounded-md px-2.5 py-1.5 text-sm font-medium text-primary hover:bg-primary/10">
              Edit
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">{pageProfile.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email Address</p>
                <p className="font-medium">{pageProfile.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Phone Number</p>
                <p className="font-medium">{pageProfile.phone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Business Details */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium">Business Details</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Building className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Business Name</p>
                <p className="font-medium">{pageProfile.businessName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Banking Details */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium">Banking Details</h2>
          <button className="rounded-md px-2.5 py-1.5 text-sm font-medium text-primary hover:bg-primary/10">
            Update
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Bank Name</p>
              <p className="font-medium">{pageProfile.bankDetails.bankName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Account Number</p>
              <p className="font-medium">
                {pageProfile.bankDetails.accountNumber}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Branch Code</p>
              <p className="font-medium">
                {pageProfile.bankDetails.branchCode}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Account Type</p>
              <p className="font-medium">
                {pageProfile.bankDetails.accountType}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

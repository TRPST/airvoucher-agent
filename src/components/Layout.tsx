"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Store,
  Users,
  CreditCard,
  FileText,
  ShoppingCart,
  History,
  User,
  Percent,
  Menu,
  X,
  ChevronRight,
  LogOut,
} from "lucide-react";
// Import Supabase client directly
import { supabase } from "@/utils/supabase/client";
import * as Avatar from "@radix-ui/react-avatar";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { motion } from "framer-motion";

import { cn } from "@/utils/cn";
import { ThemeToggle } from "@/components/ui/theme-toggle";

type UserRole = "admin" | "retailer" | "agent";

interface LayoutProps {
  children: React.ReactNode;
  role?: UserRole;
}

export const AuthContext = React.createContext<{
  user: any | null;
  profile: any | null;
  session: any | null;
  signOut: () => void;
}>({
  user: null,
  profile: null,
  session: null,
  signOut: () => {},
});

export const useAuth = () => React.useContext(AuthContext);

export function Layout({ children, role = "admin" }: LayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [user, setUser] = React.useState<any>(null);
  const [session, setSession] = React.useState<any>(null);
  const [profile, setProfile] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchSessionAndProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      const user = session?.user;
      setUser(user);

      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(profileData);
      }
    };

    fetchSessionAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        const user = currentSession?.user;
        setUser(user);

        if (user) {
          supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single()
            .then(({ data }) => setProfile(data));
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Generate navigation items based on user role
  const getNavItems = (role: UserRole) => {
    return [
      {
        name: "Dashboard",
        href: "/agent",
        icon: LayoutDashboard,
      },
      {
        name: "Commissions",
        href: "/agent/commissions",
        icon: Percent,
      },
    ];
  };

  const navItems = getNavItems(role);

  return (
    <AuthContext.Provider value={{ user, session, profile, signOut: handleSignOut }}>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        {/* Mobile top nav */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background p-4 md:hidden">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="mr-2 rounded-md p-2 hover:bg-muted"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-bold">AirVoucher</span>
          </div>
          <ThemeToggle />
        </div>

        {/* Mobile sidebar (drawer) */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-50 w-64 animate-in slide-in-from-left border-r border-border bg-background p-4 md:hidden">
              <div className="flex justify-end">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-md p-2 hover:bg-muted"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold">AirVoucher</h1>
                  {/* Logout button removed from top of sidebar */}
                  <div className="w-8 h-5"></div>{" "}
                  {/* Spacer to maintain layout */}
                </div>
                <div className="mt-4 rounded-full bg-primary py-1 px-4 text-center text-sm font-medium text-primary-foreground">
                  {role.charAt(0).toUpperCase() + role.slice(1)} Portal
                </div>
              </div>
              <nav className="mt-8 flex flex-col space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-md px-3 py-2 text-sm transition-colors",
                      pathname === item.href
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted"
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                ))}
              </nav>
              {user && (
                <div className="absolute bottom-16 left-4 right-4">
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button
                        className="w-full p-3 rounded-md flex items-center hover:bg-muted transition-colors outline-none border-0 focus:outline-none focus:border-0 focus:ring-0 focus-visible:outline-none"
                        aria-label="User menu"
                        style={{
                          outline: "none !important",
                          border: "none !important",
                        }}
                      >
                        <Avatar.Root className="w-8 h-8 rounded-full overflow-hidden bg-primary flex items-center justify-center text-primary-foreground mr-3">
                          <Avatar.Fallback>
                            {user.email.charAt(0).toUpperCase()}
                          </Avatar.Fallback>
                        </Avatar.Root>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium truncate">
                            {user.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </p>
                        </div>
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        side="top"
                        align="start"
                        sideOffset={8}
                        className="z-50 min-w-[200px] bg-background shadow-none overflow-hidden animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-200 p-1 border-0 outline-none ring-0 focus:outline-none focus:border-0 focus:ring-0"
                        style={{
                          boxShadow: "none !important",
                          outline: "none !important",
                          border: "none !important",
                          borderRadius: "0.375rem",
                        }}
                      >
                        <DropdownMenu.Item
                          className="flex items-center rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted group outline-none border-0 focus:outline-none focus:border-0 focus:ring-0 data-[highlighted]:outline-none data-[highlighted]:bg-muted data-[highlighted]:border-0 data-[state=open]:outline-none cursor-pointer"
                          onSelect={() => {
                            // Navigate to profile based on role
                            const profilePath =
                              role === "retailer"
                                ? "/retailer/account"
                                : `/${role}/profile`;
                            router.push(profilePath);
                            setSidebarOpen(false); // Close sidebar after navigation
                          }}
                        >
                          <motion.div
                            className="flex items-center justify-between w-full"
                            whileHover={{ scale: 1.01 }}
                            transition={{ duration: 0.1, ease: "easeOut" }}
                          >
                            <div className="flex items-center">
                              <User className="mr-3 h-5 w-5" />
                              View Profile
                            </div>
                            <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </motion.div>
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          className="flex items-center rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted group outline-none border-0 focus:outline-none focus:border-0 focus:ring-0 data-[highlighted]:outline-none data-[highlighted]:bg-muted data-[highlighted]:border-0 data-[state=open]:outline-none cursor-pointer"
                          onSelect={handleSignOut}
                        >
                          <motion.div
                            className="flex items-center justify-between w-full"
                            whileHover={{ scale: 1.01 }}
                            transition={{ duration: 0.1, ease: "easeOut" }}
                          >
                            <div className="flex items-center">
                              <LogOut className="mr-3 h-5 w-5" />
                              Sign Out
                            </div>
                            <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </motion.div>
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                </div>
              )}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    © 2025 AirVoucher
                  </div>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Desktop sidebar */}
        <div className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-border bg-background p-4 md:block">
          <div className="flex h-full flex-col">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">AirVoucher</h1>
                {/* Logout button removed from top of sidebar */}
                <div className="w-8 h-5"></div> {/* Spacer to maintain layout */}
              </div>
              <div className="mt-4 rounded-full bg-primary py-1 px-4 text-center text-sm font-medium text-primary-foreground">
                {role.charAt(0).toUpperCase() + role.slice(1)} Portal
              </div>
            </div>
            {/* User info removed from here - moved to bottom */}

            <nav className="flex flex-1 flex-col space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                    pathname === item.href
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted"
                  )}
                >
                  <div className="flex items-center">
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </div>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100",
                      pathname === item.href ? "opacity-100" : ""
                    )}
                  />
                </Link>
              ))}
            </nav>
            {/* Spacer to push user info and footer to bottom */}
            <div className="flex-1"></div>

            {/* User info placed at bottom of sidebar with drop-up menu */}
            {user && (
              <div className="mb-4 mt-auto">
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button
                      className="w-full p-3 rounded-md flex items-center hover:bg-muted transition-colors outline-none border-0 focus:outline-none focus:border-0 focus:ring-0 focus-visible:outline-none"
                      aria-label="User menu"
                      style={{
                        outline: "none !important",
                        border: "none !important",
                      }}
                    >
                      <Avatar.Root className="w-8 h-8 rounded-full overflow-hidden bg-primary flex items-center justify-center text-primary-foreground mr-3">
                        <Avatar.Fallback>
                          {user.email ? user.email.charAt(0).toUpperCase() : "U"}
                        </Avatar.Fallback>
                      </Avatar.Root>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium truncate">
                          {user?.email || "User"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </p>
                      </div>
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      side="top"
                      align="start"
                      sideOffset={8}
                      className="z-50 min-w-[200px] bg-background shadow-none overflow-hidden animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-200 p-1 border-0 outline-none ring-0 focus:outline-none focus:border-0 focus:ring-0"
                      style={{
                        boxShadow: "none !important",
                        outline: "none !important",
                        border: "none !important",
                        borderRadius: "0.375rem",
                      }}
                    >
                      <DropdownMenu.Item
                        className="flex items-center rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted group outline-none border-0 focus:outline-none focus:border-0 focus:ring-0 data-[highlighted]:outline-none data-[highlighted]:bg-muted data-[highlighted]:border-0 data-[state=open]:outline-none cursor-pointer"
                        onSelect={() => {
                          // Navigate to profile based on role
                          const profilePath =
                            role === "retailer"
                              ? "/retailer/account"
                              : `/${role}/profile`;
                          router.push(profilePath);
                        }}
                      >
                        <motion.div
                          className="flex items-center justify-between w-full"
                          whileHover={{ scale: 1.01 }}
                          transition={{ duration: 0.1, ease: "easeOut" }}
                        >
                          <div className="flex items-center">
                            <User className="mr-3 h-5 w-5" />
                            View Profile
                          </div>
                          <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.div>
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        className="flex items-center rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted group outline-none border-0 focus:outline-none focus:border-0 focus:ring-0 data-[highlighted]:outline-none data-[highlighted]:bg-muted data-[highlighted]:border-0 data-[state=open]:outline-none cursor-pointer"
                        onSelect={handleSignOut}
                      >
                        <motion.div
                          className="flex items-center justify-between w-full"
                          whileHover={{ scale: 1.01 }}
                          transition={{ duration: 0.1, ease: "easeOut" }}
                        >
                          <div className="flex items-center">
                            <LogOut className="mr-3 h-5 w-5" />
                            Sign Out
                          </div>
                          <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.div>
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>
            )}

            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  © 2025 AirVoucher
                </div>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 md:pl-64">
          <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </AuthContext.Provider>
  );
}

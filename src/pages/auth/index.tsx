import { motion } from 'framer-motion';
import Image from 'next/image';
import { CustomAuth } from '@/components/CustomAuth';

export default function AuthPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-center px-4">
          <Image src="/assets/airvoucher-logo.png" alt="AirVoucher Logo" width={100} height={100} />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-lg"
        >
          <h2 className="mb-6 text-center text-2xl font-bold">Agent Login</h2>
          <CustomAuth role="agent" />
        </motion.div>
      </main>

      <footer className="border-t border-border py-6">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex justify-center text-sm text-muted-foreground">
            &copy; 2025 AirVoucher. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
} 
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

      <main className="flex flex-1 items-center justify-center p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-xl md:min-h-[520px] md:flex-row"
        >
          <div className="flex w-full flex-col gap-8 p-10 md:w-3/5">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Agent Login</h2>
              <p className="mt-3 text-base text-muted-foreground">
                Access the AirVoucher agent portal with your credentials. Keep your login details secure.
              </p>
            </div>
            <CustomAuth role="agent" />
          </div>

          <div className="relative flex h-56 w-full items-center justify-center bg-muted md:h-auto md:w-2/5">
            <Image
              src="/assets/airvoucher-logo.png"
              alt="AirVoucher Logo"
              width={420}
              height={420}
              className="h-40 w-40 object-contain md:h-52 md:w-52"
              priority
            />
          </div>
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

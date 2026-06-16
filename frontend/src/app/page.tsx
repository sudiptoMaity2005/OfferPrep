import { SignInButton, Show, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <header className="absolute top-0 w-full p-6 flex justify-between items-center">
        <div className="font-bold text-xl">OfferPrep</div>
        <div>
          <Show when="signed-out">
            <SignInButton />
          </Show>
          <Show when="signed-in">
            <UserButton afterSignOutUrl="/" />
          </Show>
        </div>
      </header>
      <main className="flex flex-col gap-8 row-start-2 items-center text-center">
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-gray-900">
          Welcome to OfferPrep
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl">
          The AI-Powered Interview Preparation & Assessment Platform.
        </p>
        
        <Show when="signed-out">
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-4">Please sign in to start generating customized interview sessions.</p>
            <SignInButton mode="modal">
              <Button size="lg" className="px-8">Sign In</Button>
            </SignInButton>
          </div>
        </Show>

        <Show when="signed-in">
          <div className="mt-4">
            <Link href="/dashboard">
              <Button size="lg" className="px-8">Go to Dashboard</Button>
            </Link>
          </div>
        </Show>
      </main>
    </div>
  );
}

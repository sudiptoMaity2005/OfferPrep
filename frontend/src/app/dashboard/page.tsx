import { CreateInterviewForm } from "@/components/CreateInterviewForm";
import { PreviousInterviews } from "@/components/PreviousInterviews";
import { UserButton } from "@clerk/nextjs";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-neutral-900">OfferPrep Dashboard</h1>
        <UserButton afterSignOutUrl="/" />
      </header>

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-neutral-900 mb-2">Welcome Back</h2>
          <p className="text-neutral-500 max-w-xl mx-auto">
            Ready for your next mock interview? Fill out the details below and our AI will generate a tailored session for you.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5">
            <CreateInterviewForm />
          </div>
          <div className="lg:col-span-7">
            <PreviousInterviews />
          </div>
        </div>
      </main>
    </div>
  );
}

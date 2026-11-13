import { CreateInterviewForm } from "@/components/CreateInterviewForm";
import { PreviousInterviews } from "@/components/PreviousInterviews";
import { AnalyticsOverview } from "@/components/AnalyticsOverview";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { UserButton } from "@clerk/nextjs";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 transition-colors">
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100">OfferPrep Dashboard</h1>
          <span className="hidden sm:inline-block px-2.5 py-0.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 rounded-full">
            Practice Workspace
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <UserButton />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <ErrorBoundary fallbackTitle="Dashboard loading error">
          <div className="mb-8 text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              Engineering Practice Hub
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 max-w-xl text-sm sm:text-base mt-1">
              Simulate timed technical interviews tailored to your target discipline and receive structured question-by-question feedback.
            </p>
          </div>

          {/* Real-time Analytics & Progress Tracking */}
          <AnalyticsOverview />

          {/* Create Session & History Section */}
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5">
              <CreateInterviewForm />
            </div>
            <div className="lg:col-span-7">
              <PreviousInterviews />
            </div>
          </div>
        </ErrorBoundary>
      </main>
    </div>
  );
}

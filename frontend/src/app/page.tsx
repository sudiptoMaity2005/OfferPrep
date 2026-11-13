"use client";

import { SignInButton, Show, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Mic,
  Clock,
  ArrowRight,
  Brain,
  TrendingUp,
  Target,
  Sliders,
  CheckCircle2,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-neutral-900 selection:text-white dark:selection:bg-neutral-100 dark:selection:text-neutral-900">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-semibold text-lg tracking-tight">
            <span className="w-8 h-8 rounded-md bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 flex items-center justify-center font-bold text-sm">
              OP
            </span>
            <span className="font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">OfferPrep</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground font-medium">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">
              How It Works
            </a>
            <a href="#roles" className="hover:text-foreground transition-colors">
              Roles Covered
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Show when="signed-out">
              <SignInButton mode="modal">
                <Button size="sm" className="font-medium px-4">
                  Sign In
                </Button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <Link href="/dashboard">
                <Button size="sm" className="font-medium gap-1.5 px-4">
                  Dashboard <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <UserButton />
            </Show>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28 border-b border-border/60">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 text-center space-y-8">
          {/* Announcement pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-800 dark:text-neutral-200">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span>Interactive Mock Interviews • Real-Time Spoken Practice</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 max-w-4xl mx-auto leading-[1.12]">
            Realistic technical interviews for software engineers
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Practice speaking through system design, architecture, and coding trade-offs under real interview pressure. Get structured rubrics, question timers, and actionable feedback.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <Button size="lg" className="w-full sm:w-auto text-base px-7 py-6 rounded-lg font-medium gap-2">
                  Start Practice Interview <ArrowRight className="w-4 h-4" />
                </Button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button size="lg" className="w-full text-base px-7 py-6 rounded-lg font-medium gap-2">
                  Go to Dashboard <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </Show>
            <a href="#how-it-works" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full text-base px-6 py-6 rounded-lg font-medium">
                How It Works
              </Button>
            </a>
          </div>

          {/* Realistic Mock Preview Card */}
          <div className="pt-8 max-w-3xl mx-auto">
            <div className="rounded-xl border border-border bg-card p-6 sm:p-8 text-left shadow-sm space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-semibold tracking-wider uppercase text-neutral-500 dark:text-neutral-400">
                    Question 2 of 5 • Distributed Systems
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    HARD
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono font-medium px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                  <Clock className="w-3.5 h-3.5 text-neutral-500" />
                  02:18
                </div>
              </div>

              <p className="text-base sm:text-lg font-medium text-neutral-900 dark:text-neutral-100 leading-snug">
                &ldquo;How would you design a distributed rate limiter that handles 50,000 requests per second across multi-region clusters without introducing cross-region latency?&rdquo;
              </p>

              <div className="bg-neutral-50 dark:bg-neutral-900/60 rounded-lg p-3.5 border border-border text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Voice input active — transcribing response...</span>
                </div>
                <span className="text-xs font-mono font-semibold text-neutral-900 dark:text-neutral-200">
                  Target: 3 min response
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="py-20 bg-neutral-50/50 dark:bg-neutral-900/20 border-b border-border/60">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Engineered for genuine interview stamina
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Targeting the exact failure points candidates encounter: articulation under time limits, trade-off depth, and structured problem solving.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 flex items-center justify-center font-bold">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base text-neutral-900 dark:text-neutral-100">Role-Specific Question Sets</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Calibrated questions for Backend, Frontend, DevOps, ML, and Full Stack across Fresher, Mid-Level, and Staff roles.
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 flex items-center justify-center font-bold">
                <Mic className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base text-neutral-900 dark:text-neutral-100">Speech-to-Text Practice</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Speak your thoughts out loud using browser speech recognition. Builds vocal confidence and eliminates freezing.
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base text-neutral-900 dark:text-neutral-100">Timed Prompts</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Practice with 2, 3, or 5-minute countdowns. Learn to structure your thoughts quickly without rambling.
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 flex items-center justify-center font-bold">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base text-neutral-900 dark:text-neutral-100">Structured Evaluation Rubrics</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Detailed breakdowns across Technical Precision, Communication Clarity, and Completeness with targeted skill gap analysis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 border-b border-border/60">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              How OfferPrep works
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              A distraction-free, forward-only interview flow designed to emulate real on-site rounds.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-md bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-semibold text-sm flex items-center justify-center">
                1
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Configure your target</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Select your engineering discipline, target seniority, interviewer style, and company track (Google, Amazon, Meta, Microsoft, or General).
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-9 h-9 rounded-md bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-semibold text-sm flex items-center justify-center">
                2
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Answer in real time</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Work through five tailored technical questions. Dictate your thoughts out loud or type code blocks and architecture explanations.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-9 h-9 rounded-md bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-semibold text-sm flex items-center justify-center">
                3
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Review feedback & gaps</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Examine question-level verdicts, benchmark your readiness score, and identify specific technical concepts that need reinforcement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Roles Covered Section */}
      <section id="roles" className="py-20 bg-neutral-50/50 dark:bg-neutral-900/20 border-b border-border/60">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 text-center space-y-8">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Supported Engineering Tracks
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              OfferPrep calibrates depth and evaluation standards to real industry hiring rubrics.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-4xl mx-auto">
            {[
              "Software Development Engineer (SDE)",
              "Backend Engineer",
              "Frontend Engineer",
              "Full Stack Engineer",
              "Machine Learning Engineer",
              "Data Scientist",
              "DevOps & SRE",
              "Data Engineer",
              "Product Manager",
              "Mobile Developer (iOS / Android)",
            ].map((role, idx) => (
              <span
                key={idx}
                className="px-3.5 py-1.5 rounded-lg bg-card border border-border text-sm font-medium text-neutral-800 dark:text-neutral-200"
              >
                {role}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 text-center">
        <div className="container mx-auto max-w-3xl px-4 sm:px-6 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Build interview confidence through deliberate practice
          </h2>
          <p className="text-muted-foreground text-base max-w-lg mx-auto">
            Start a realistic mock session in seconds. No setup required.
          </p>
          <div className="pt-2">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <Button size="lg" className="text-base px-8 py-6 rounded-lg font-medium gap-2">
                  Get Started <ArrowRight className="w-4 h-4" />
                </Button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <Link href="/dashboard">
                <Button size="lg" className="text-base px-8 py-6 rounded-lg font-medium gap-2">
                  Open Dashboard <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </Show>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 py-8 bg-background">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <span className="w-5 h-5 rounded bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 flex items-center justify-center font-bold text-[10px]">
              OP
            </span>
            <span>OfferPrep</span>
          </div>
          <p>© {new Date().getFullYear()} OfferPrep. Realistic technical interview preparation platform.</p>
          <div className="flex items-center gap-4">
            <span>Built for software engineers</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

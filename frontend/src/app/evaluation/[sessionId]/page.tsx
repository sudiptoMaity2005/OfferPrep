"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from "react-markdown";
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from "recharts";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileText,
  CheckCheck,
  RotateCcw,
  Target,
  Compass,
  Building2,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { triggerConfetti } from "@/lib/confetti";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { EvaluationWithSession, QuestionDifficulty } from "@/types";

function DifficultyBadge({ difficulty }: { difficulty?: QuestionDifficulty }) {
  const diff = difficulty || "MEDIUM";
  const styles: Record<QuestionDifficulty, string> = {
    EASY: "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    MEDIUM: "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    HARD: "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800",
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${styles[diff] || styles.MEDIUM}`}>
      {diff}
    </span>
  );
}

function VerdictBadge({ verdict }: { verdict?: string }) {
  const v = verdict || "Satisfactory";
  if (v === "Strong") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
        <CheckCircle2 className="w-3.5 h-3.5" /> Strong
      </span>
    );
  }
  if (v === "Satisfactory") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
        <CheckCheck className="w-3.5 h-3.5" /> Satisfactory
      </span>
    );
  }
  if (v === "Needs Improvement") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
        <AlertCircle className="w-3.5 h-3.5" /> Needs Improvement
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
      <AlertCircle className="w-3.5 h-3.5" /> Poor
    </span>
  );
}

function EvaluationSkeleton() {
  return (
    <div className="container mx-auto py-10 max-w-5xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-10 w-80 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-9 w-36 rounded-md" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="flex flex-col items-center justify-center p-6 shadow-sm">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-32 rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <Skeleton className="h-7 w-52 mb-2" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function EvaluationDashboard() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const router = useRouter();
  const { getToken, userId } = useAuth();

  const [evaluation, setEvaluation] = useState<EvaluationWithSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"summary" | "feedback" | "skillgaps">("summary");

  useEffect(() => {
    const fetchEvaluation = async () => {
      if (!userId) return;
      try {
        const token = await getToken();
        const data = await apiClient.fetchEvaluation(sessionId, userId, token);
        setEvaluation(data);
        triggerConfetti();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Could not load evaluation";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchEvaluation();
    }
  }, [sessionId, userId, getToken]);

  if (loading) {
    return <EvaluationSkeleton />;
  }

  if (!evaluation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-4">
        <p className="text-red-500 font-medium">Evaluation not found</p>
        <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  const chartData = [
    { name: "Technical", score: Math.round(evaluation.technicalScore), fill: "hsl(var(--chart-1))" },
    { name: "Communication", score: Math.round(evaluation.communicationScore), fill: "hsl(var(--chart-2))" },
    { name: "Completeness", score: Math.round(evaluation.completenessScore), fill: "hsl(var(--chart-3))" },
    { name: "Overall", score: Math.round(evaluation.overallScore), fill: "hsl(var(--chart-4))" },
  ];

  const questions = evaluation.session?.questions || [];
  const questionFeedbackList = evaluation.questionFeedback || [];
  const skillGaps = evaluation.skillGaps || [];
  const readiness = Math.round(evaluation.readinessScore || evaluation.overallScore);

  return (
    <div className="container mx-auto py-10 max-w-5xl space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
            <span className="text-foreground">{evaluation.session?.role || "Interview"}</span>
            <span>•</span>
            <span>{evaluation.session?.experienceLevel}</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400">
              <Building2 className="w-3.5 h-3.5" />
              {evaluation.session?.company || "General Tech Standard"}
            </span>
            {evaluation.session?.resumeText && (
              <>
                <span>•</span>
                <span className="text-purple-600 dark:text-purple-400">Resume Tailored</span>
              </>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Interview Performance Evaluation
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Detailed review of answers, question-by-question scoring, and skill calibration.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button onClick={() => router.push("/dashboard")} variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Button>
        </div>
      </div>

      {/* Placement Readiness Banner */}
      <div className="p-5 sm:p-6 rounded-xl bg-neutral-900 text-white dark:bg-neutral-900 border border-neutral-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            <Target className="w-4 h-4 text-neutral-300" />
            <span>Placement Readiness Score</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold">
            {readiness >= 80 ? "Offer Candidate Potential" : readiness >= 60 ? "Competitive Candidate" : "Developing Readiness"}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-300 max-w-xl">
            {readiness >= 80
              ? "Exhibits strong technical precision, structured communication, and edge-case awareness for target roles."
              : "Demonstrates solid foundational concepts; targeted practice on complex architecture trade-offs is recommended."}
          </p>
        </div>
        <div className="px-5 py-3 rounded-lg bg-neutral-800/80 border border-neutral-700 text-center shrink-0">
          <div className="text-3xl font-extrabold">{readiness}%</div>
          <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide">Readiness Index</div>
        </div>
      </div>

      {/* Radial Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {chartData.map((data, index) => (
          <Card key={index} className="flex flex-col items-center justify-center p-4 sm:p-6 text-center shadow-sm border-neutral-200 dark:border-neutral-800">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm sm:text-base text-muted-foreground font-medium">{data.name}</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-28 w-28 sm:h-32 sm:w-32 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    innerRadius="78%"
                    outerRadius="100%"
                    data={[data]}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                    <RadialBar background dataKey="score" cornerRadius={10} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight">{data.score}</span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground">/ 100</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab("summary")}
          className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === "summary"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          Question-by-Question Review ({questions.length})
        </button>
        <button
          onClick={() => setActiveTab("skillgaps")}
          className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === "skillgaps"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
          }`}
        >
          <Compass className="w-4 h-4" />
          Skill Gaps & Competencies ({skillGaps.length})
        </button>
        <button
          onClick={() => setActiveTab("feedback")}
          className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === "feedback"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
          }`}
        >
          <FileText className="w-4 h-4" />
          Detailed Debrief
        </button>
      </div>

      {/* Tab 1: Question-by-Question Breakdown */}
      {activeTab === "summary" && (
        <div className="space-y-6">
          {questions.map((q, idx) => {
            const qFeedback = questionFeedbackList.find((f) => f.questionIndex === idx);
            const score = qFeedback?.score ?? Math.round(evaluation.overallScore);
            const verdict = qFeedback?.verdict ?? "Satisfactory";
            const feedbackText = qFeedback?.feedback || "Answer captured.";

            return (
              <Card key={q.id} className="shadow-sm border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <CardHeader className="bg-neutral-50/70 dark:bg-neutral-900/60 border-b border-neutral-200/80 dark:border-neutral-800 pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        Question {idx + 1} • {q.category}
                      </span>
                      <DifficultyBadge difficulty={q.difficulty} />
                      {q.isFollowUp && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          ADAPTIVE PROBE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                        {score} <span className="text-xs text-neutral-400 font-normal">/ 100</span>
                      </span>
                      <VerdictBadge verdict={verdict} />
                    </div>
                  </div>
                  <CardTitle className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 leading-snug">
                    {q.text}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  {/* Candidate Answer */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400 mb-1 tracking-wide">
                      Your Answer:
                    </h4>
                    <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg text-sm text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-800 whitespace-pre-wrap leading-relaxed">
                      {q.response?.transcript?.trim() ? (
                        q.response.transcript
                      ) : (
                        <span className="italic text-neutral-400">No answer provided.</span>
                      )}
                    </div>
                  </div>

                  {/* AI Feedback */}
                  <div className="bg-blue-50/60 dark:bg-blue-950/40 rounded-lg p-3.5 border border-blue-100 dark:border-blue-900/60">
                    <h4 className="text-xs font-semibold text-blue-900 dark:text-blue-300 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      Interviewer Assessment:
                    </h4>
                    <p className="text-sm text-blue-950 dark:text-blue-200 leading-relaxed">
                      {feedbackText}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tab 2: Skill Gaps & Competencies */}
      {activeTab === "skillgaps" && (
        <div className="space-y-4">
          <Card className="border-neutral-200 dark:border-neutral-800 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Compass className="w-5 h-5 text-blue-600" />
                Diagnostic Skill Gap Matrix
              </CardTitle>
              <CardDescription>
                Specific competencies extracted and calibrated from your technical responses.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {skillGaps.length === 0 ? (
                <p className="text-sm text-muted-foreground">Competency gaps calibrated as part of executive report.</p>
              ) : (
                skillGaps.map((gap, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-border bg-card/60 space-y-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-foreground">{gap.topic}</span>
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                            gap.status === "Proficient"
                              ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                              : "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                          }`}
                        >
                          {gap.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {gap.recommendation}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 3: Overall Detailed Markdown Report */}
      {activeTab === "feedback" && (
        <Card className="shadow-sm border-neutral-200 dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Comprehensive Performance Debrief</CardTitle>
            <CardDescription>
              Detailed synthesis of communication style, technical competency, and areas for targeted growth.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-bold prose-h3:text-lg prose-h3:mt-4 prose-p:leading-relaxed">
              <ReactMarkdown>{evaluation.feedback}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bottom Actions */}
      <div className="flex justify-between items-center pt-4 border-t border-neutral-200 dark:border-neutral-800">
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>
        <Button onClick={() => router.push("/dashboard")}>
          <RotateCcw className="w-4 h-4 mr-2" /> Start Another Interview
        </Button>
      </div>
    </div>
  );
}

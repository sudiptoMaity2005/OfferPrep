"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Play, CheckCircle, Award } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import type { InterviewSession } from "@/types";

function InterviewCardSkeleton() {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-48 mb-1" />
        <Skeleton className="h-4 w-32 mb-4" />
        <Skeleton className="h-9 w-full rounded-md" />
      </CardContent>
    </Card>
  );
}

export function PreviousInterviews() {
  const { getToken, userId } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!userId) return;
      try {
        const token = await getToken();
        const data = await apiClient.fetchSessions(userId, token);
        setSessions(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Could not load interviews";
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, [userId, getToken]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-52" />
        <div className="grid gap-4 sm:grid-cols-2">
          <InterviewCardSkeleton />
          <InterviewCardSkeleton />
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card className="border-dashed p-6 text-center text-neutral-500">
        <p className="text-sm">No interviews completed yet. Create your first session on the left!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Past Interview Sessions</h3>
        <span className="text-xs text-neutral-500">{sessions.length} recorded</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {sessions.map((session) => {
          const evalScore = session.evaluation?.overallScore;
          return (
            <Card key={session.id} className="shadow-sm hover:shadow-md transition-shadow border-neutral-200 dark:border-neutral-800">
              <CardHeader className="pb-2.5">
                <CardTitle className="text-base flex justify-between items-start gap-2">
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100 leading-tight">{session.role}</span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                      session.status === "COMPLETED"
                        ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                        : "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                    }`}
                  >
                    {session.status}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs text-neutral-500 dark:text-neutral-400 space-y-0.5">
                  <p>
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">{session.experienceLevel}</span> • {session.style}
                  </p>
                  <p>
                    {new Date(session.createdAt).toLocaleDateString()}
                    {session.timePerQuestion ? ` • ${session.timePerQuestion}m timer` : ""}
                  </p>
                </div>

                {evalScore !== undefined && evalScore !== null && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200 bg-neutral-100/80 dark:bg-neutral-800 px-2.5 py-1 rounded-md">
                    <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    Overall Score: <span className="text-blue-600 dark:text-blue-400 font-bold">{Math.round(evalScore)}%</span>
                  </div>
                )}

                {session.status === "COMPLETED" ? (
                  session.evaluation ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-between border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs"
                      onClick={() => router.push(`/evaluation/${session.id}`)}
                    >
                      <span>Review Assessment</span>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full justify-between text-xs"
                      onClick={() => router.push(`/interview/${session.id}`)}
                    >
                      <span>Generate Evaluation</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  )
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-xs"
                    onClick={() => router.push(`/interview/${session.id}`)}
                  >
                    <span>Resume Interview</span>
                    <Play className="w-3.5 h-3.5" />
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

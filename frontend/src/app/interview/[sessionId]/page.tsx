"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { UserButton, useAuth } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Mic, MicOff, Send, Loader2, Clock, AlertTriangle, CornerDownRight, CheckCircle2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { triggerConfetti } from "@/lib/confetti";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { InterviewSession, QuestionDifficulty } from "@/types";

// --- Difficulty Badge Component ---
function DifficultyBadge({ difficulty }: { difficulty?: QuestionDifficulty }) {
  const diff = difficulty || "MEDIUM";
  const styles: Record<QuestionDifficulty, string> = {
    EASY: "bg-emerald-100 text-emerald-800 border-emerald-200",
    MEDIUM: "bg-amber-100 text-amber-800 border-amber-200",
    HARD: "bg-rose-100 text-rose-800 border-rose-200",
  };
  return (
    <span
      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
        styles[diff] || styles.MEDIUM
      }`}
    >
      {diff}
    </span>
  );
}

// --- Question Countdown Timer Component ---
function QuestionTimer({
  totalSeconds,
  onExpire,
  questionKey,
}: {
  totalSeconds: number;
  onExpire: () => void;
  questionKey: string;
}) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    setRemaining(totalSeconds);
  }, [totalSeconds, questionKey]);

  useEffect(() => {
    if (remaining <= 0) {
      onExpireRef.current();
      return;
    }
    const interval = setInterval(() => {
      setRemaining((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [remaining]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isWarning = remaining <= 30 && remaining > 10;
  const isDanger = remaining <= 10;

  return (
    <div
      className={`flex items-center gap-1.5 text-xs font-mono font-semibold px-3 py-1.5 rounded-lg border transition-all ${
        isDanger
          ? "bg-rose-50 text-rose-700 border-rose-300 animate-pulse ring-2 ring-rose-200"
          : isWarning
          ? "bg-amber-50 text-amber-700 border-amber-300"
          : "bg-neutral-100 text-neutral-700 border-neutral-200"
      }`}
    >
      {isDanger ? <AlertTriangle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
      <span>
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
    </div>
  );
}

function InterviewRoomSkeleton() {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </header>
      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col max-w-4xl">
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-2.5 w-full rounded-full" />
        </div>
        <Card className="shadow-md mb-6">
          <CardHeader className="bg-blue-50/50 rounded-t-xl border-b border-blue-100">
            <Skeleton className="h-3 w-28 mb-3" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4 mt-1" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-32 rounded-md" />
            </div>
            <Skeleton className="h-[200px] w-full rounded-md" />
          </CardContent>
          <CardFooter className="bg-neutral-50 p-6 flex justify-end rounded-b-xl border-t border-neutral-100">
            <Skeleton className="h-10 w-36 rounded-md" />
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}

export default function InterviewRoom() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { getToken, userId } = useAuth();

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [timerExpired, setTimerExpired] = useState(false);
  const [isProbing, setIsProbing] = useState(false);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    ) {
      const SpeechRecognitionCtor =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognitionCtor();
      rec.continuous = true;
      rec.interimResults = true;

      rec.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            currentTranscript += event.results[i][0].transcript + " ";
          }
        }
        if (currentTranscript) {
          setTranscript((prev) => prev + currentTranscript);
        }
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        toast.error("Speech recognition error. Please type your answer or retry.");
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      setRecognition(rec);
    }
  }, []);

  useEffect(() => {
    const fetchSession = async () => {
      if (!userId) return;
      try {
        const token = await getToken();
        const data = await apiClient.fetchSession(sessionId, userId, token);

        let startIdx = 0;
        for (let i = 0; i < data.questions.length; i++) {
          if (!data.questions[i].response) {
            startIdx = i;
            break;
          }
          if (i === data.questions.length - 1) {
            startIdx = data.questions.length;
          }
        }

        setSession(data);
        setCurrentQuestionIndex(startIdx);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load interview";
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, [sessionId, userId, getToken]);

  // Auto-restore local draft on question switch or page reload
  useEffect(() => {
    if (typeof window !== "undefined" && sessionId) {
      const draftKey = `offerprep_draft_${sessionId}_${currentQuestionIndex}`;
      const saved = localStorage.getItem(draftKey);
      if (saved && !transcript) {
        setTranscript(saved);
      }
    }
  }, [sessionId, currentQuestionIndex]);

  // Auto-save draft as candidate types or speaks
  useEffect(() => {
    if (typeof window !== "undefined" && sessionId && transcript) {
      const draftKey = `offerprep_draft_${sessionId}_${currentQuestionIndex}`;
      localStorage.setItem(draftKey, transcript);
    }
  }, [sessionId, currentQuestionIndex, transcript]);

  const toggleRecording = () => {
    if (!recognition) {
      toast.warning("Speech recognition is not supported in this browser. Please type your answer.");
      return;
    }
    if (isRecording) {
      recognition.stop();
    } else {
      recognition.start();
      setIsRecording(true);
    }
  };

  const handleNext = useCallback(async () => {
    if (!transcript.trim()) {
      toast.error("Please provide an answer before continuing.");
      return;
    }

    if (!session) return;

    setIsSubmitting(true);

    try {
      const question = session.questions[currentQuestionIndex];
      const token = await getToken();

      await apiClient.submitResponse(
        sessionId,
        question.id,
        transcript,
        userId || "",
        token
      );

      if (typeof window !== "undefined") {
        localStorage.removeItem(`offerprep_draft_${sessionId}_${currentQuestionIndex}`);
      }
      toast.success("Answer recorded!");
      setTranscript("");
      setTimerExpired(false);
      setCurrentQuestionIndex((prev) => prev + 1);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save answer";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [session, currentQuestionIndex, transcript, sessionId, userId, getToken]);

  const handleAdaptiveProbe = async () => {
    if (!transcript.trim()) {
      toast.error("Please answer the current question before requesting a follow-up probe.");
      return;
    }
    if (!session) return;
    setIsProbing(true);
    try {
      const question = session.questions[currentQuestionIndex];
      const token = await getToken();

      // First submit current response
      await apiClient.submitResponse(sessionId, question.id, transcript, userId || "", token);

      // Generate the adaptive follow-up question
      const followUp = await apiClient.requestAdaptiveFollowUp(
        sessionId,
        question.id,
        transcript,
        userId || "",
        token
      );

      const updatedQuestions = [...session.questions];
      updatedQuestions.splice(currentQuestionIndex + 1, 0, followUp);
      setSession({ ...session, questions: updatedQuestions });

      if (typeof window !== "undefined") {
        localStorage.removeItem(`offerprep_draft_${sessionId}_${currentQuestionIndex}`);
      }
      toast.success("Follow-up question generated! Advancing...");
      setTranscript("");
      setTimerExpired(false);
      setCurrentQuestionIndex((prev) => prev + 1);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to generate follow-up";
      toast.error(message);
    } finally {
      setIsProbing(false);
    }
  };

  const handleTimerExpire = useCallback(() => {
    setTimerExpired(true);
    toast.warning("⏰ Time is up for this question! Please submit your answer.");
    if (isRecording && recognition) {
      recognition.stop();
    }
  }, [isRecording, recognition]);

  if (isLoading) {
    return <InterviewRoomSkeleton />;
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 text-red-500">
        Failed to load interview session.
      </div>
    );
  }

  const isComplete = Boolean(session && currentQuestionIndex >= session.questions.length);

  useEffect(() => {
    if (isComplete) {
      triggerConfetti();
    }
  }, [isComplete]);

  if (isComplete) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] p-4 animate-in fade-in zoom-in-95 duration-500">
        <Card className="w-full max-w-lg shadow-xl text-center border-neutral-200 dark:border-neutral-800">
          <CardHeader>
            <div className="mx-auto w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold">Session Completed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm sm:text-base">
              You answered all {session.questions.length} questions for this session.
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Click below to generate your detailed performance evaluation, readiness score, and question-by-question breakdown.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center pb-8">
            <Button
              size="lg"
              disabled={isEvaluating}
              onClick={async () => {
                setIsEvaluating(true);
                try {
                  const token = await getToken();
                  await apiClient.evaluateSession(sessionId, userId || "", token);
                  toast.success("Evaluation completed!");
                  router.push(`/evaluation/${sessionId}`);
                } catch (error) {
                  const message = error instanceof Error ? error.message : "Evaluation failed. Please try again.";
                  toast.error(message);
                } finally {
                  setIsEvaluating(false);
                }
              }}
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Compiling evaluation report...
                </>
              ) : (
                "Complete Session & View Evaluation"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const currentQuestion = session.questions[currentQuestionIndex];
  const progress = (currentQuestionIndex / session.questions.length) * 100;
  const timeLimit = session.timePerQuestion || 0;

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">OfferPrep Live Interview</h1>
          <span className="text-xs text-neutral-500 hidden sm:inline-block">
            {session.role} ({session.experienceLevel})
          </span>
        </div>
        <div className="flex items-center gap-3">
          {timeLimit > 0 && (
            <QuestionTimer
              totalSeconds={timeLimit * 60}
              onExpire={handleTimerExpire}
              questionKey={`q-${currentQuestionIndex}`}
            />
          )}
          <ThemeToggle />
          <UserButton />
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm font-medium text-neutral-500 mb-2">
            <span>
              Question {currentQuestionIndex + 1} of {session.questions.length}
            </span>
            <span>{Math.round(progress)}% Completed</span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Timer Expiry Alert */}
        {timerExpired && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-sm font-medium animate-in fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>Time has elapsed for this question. Please finalize and submit your response.</span>
          </div>
        )}

        {/* Question Card */}
        <Card className="shadow-md mb-6 border-blue-100">
          <CardHeader className="bg-blue-50/50 rounded-t-xl border-b border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                {currentQuestion.category} Question
              </span>
              <DifficultyBadge difficulty={currentQuestion.difficulty} />
              {currentQuestion.isFollowUp && (
                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700">
                  Follow-up Question
                </span>
              )}
            </div>
            <CardTitle className="text-xl leading-relaxed text-neutral-800">
              {currentQuestion.text}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-neutral-700">Your Answer</label>
              <Button
                variant={isRecording ? "destructive" : "outline"}
                size="sm"
                onClick={toggleRecording}
                className="flex items-center gap-2"
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {isRecording ? "Stop Recording" : "Use Voice Input"}
              </Button>
            </div>
            <Textarea
              className="min-h-[220px] text-base p-4"
              placeholder="Type your answer here, or paste any code you've written. Alternatively, click 'Use Voice Input' to speak your answer."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
            />
          </CardContent>
          <CardFooter className="bg-neutral-50 dark:bg-neutral-900/50 p-6 flex flex-wrap items-center justify-between gap-3 rounded-b-xl border-t border-neutral-100 dark:border-neutral-800">
            <div>
              {session.isAdaptive && !currentQuestion.isFollowUp && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAdaptiveProbe}
                  disabled={isSubmitting || isProbing || !transcript.trim()}
                  className="gap-2 text-neutral-800 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  {isProbing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating follow-up...
                    </>
                  ) : (
                    <>
                      <CornerDownRight className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                      Request Follow-up Question
                    </>
                  )}
                </Button>
              )}
            </div>

            <Button
              size="lg"
              onClick={handleNext}
              disabled={isSubmitting || isProbing || !transcript.trim()}
              className="px-8"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Next Question
                  <Send className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <div className="text-center text-sm text-neutral-400 mt-2">
          Note: Forward-only simulation. Once submitted, questions cannot be revisited.
        </div>
      </main>
    </div>
  );
}

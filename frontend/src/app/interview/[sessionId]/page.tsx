"use client";

import { useState, useEffect } from "react";
import { UserButton, useAuth } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Mic, MicOff, Send, Loader2 } from "lucide-react";

export default function InterviewRoom() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { getToken, userId } = useAuth();
  
  const [session, setSession] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [recognition, setRecognition] = useState<any>(null);

  const [isEvaluating, setIsEvaluating] = useState(false);

  useEffect(() => {
    // Initialize Web Speech API
    if (typeof window !== "undefined" && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognition();
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
      try {
        const token = await getToken();
        const res = await fetch(`http://localhost:5001/api/interviews/${sessionId}?userId=${userId}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error);
        
        // Find the first unanswered question
        let startIdx = 0;
        for (let i = 0; i < data.questions.length; i++) {
          if (!data.questions[i].response) {
            startIdx = i;
            break;
          }
          if (i === data.questions.length - 1) {
            // All answered
            startIdx = data.questions.length;
          }
        }
        
        setSession(data);
        setCurrentQuestionIndex(startIdx);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) fetchSession();
  }, [sessionId, userId, getToken]);

  const toggleRecording = () => {
    if (!recognition) {
      alert("Speech recognition is not supported in this browser. Please type your answer.");
      return;
    }

    if (isRecording) {
      recognition.stop();
    } else {
      recognition.start();
      setIsRecording(true);
    }
  };

  const handleNext = async () => {
    if (!transcript.trim()) {
      setError("Please provide an answer before continuing.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const question = session.questions[currentQuestionIndex];
      const token = await getToken();
      
      const res = await fetch(`http://localhost:5001/api/interviews/${sessionId}/questions/${question.id}/response`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ transcript, userId })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit answer");
      }

      setTranscript("");
      
      // Simply increment to render the 'isComplete' screen when passing the last question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 text-red-500">
        Error: {error}
      </div>
    );
  }

  // If all questions are answered or session is done
  const isComplete = session && currentQuestionIndex >= session.questions.length;
  if (isComplete) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] p-4">
        <Card className="w-full max-w-lg shadow-md text-center">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Interview Complete! 🎉</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Great job! You have answered all the questions for this interview session.
            </p>
            <p className="text-sm">
              Ready to see how you did? Our AI is waiting to analyze your answers and generate a comprehensive feedback report.
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
                  const res = await fetch(`http://localhost:5001/api/interviews/${sessionId}/evaluate`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ userId })
                  });
                  if (res.ok) {
                    router.push(`/evaluation/${sessionId}`);
                  } else {
                    console.error("Evaluation failed", await res.text());
                  }
                } catch (error) {
                  console.error(error);
                } finally {
                  setIsEvaluating(false);
                }
              }}
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Transcript...
                </>
              ) : (
                "Generate My Evaluation"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const currentQuestion = session.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex) / session.questions.length) * 100;

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-neutral-900">OfferPrep Live Interview</h1>
        <UserButton afterSignOutUrl="/" />
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm font-medium text-neutral-500 mb-2">
            <span>Question {currentQuestionIndex + 1} of {session.questions.length}</span>
            <span>{Math.round(progress)}% Completed</span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {/* Question Card */}
        <Card className="shadow-md mb-6 border-blue-100">
          <CardHeader className="bg-blue-50/50 rounded-t-xl border-b border-blue-100">
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-2">
              {currentQuestion.category} Question
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
              className="min-h-[200px] text-base p-4"
              placeholder="Type your answer here, or paste any code you've written. Alternatively, click 'Use Voice Input' to speak your answer."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
            />
            {error && <p className="text-red-500 text-sm mt-3 font-medium">{error}</p>}
          </CardContent>
          <CardFooter className="bg-neutral-50 p-6 flex justify-end rounded-b-xl border-t border-neutral-100">
            <Button 
              size="lg" 
              onClick={handleNext} 
              disabled={isSubmitting || !transcript.trim()}
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
        
        <div className="text-center text-sm text-neutral-400 mt-4">
          Note: This is a strict forward-only interview. Once you submit, you cannot return to this question.
        </div>
      </main>
    </div>
  );
}

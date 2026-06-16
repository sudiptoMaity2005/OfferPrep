"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Play, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function PreviousInterviews() {
  const { getToken, userId } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`http://localhost:5001/api/interviews?userId=${userId}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        if (!res.ok) throw new Error("Failed to fetch past interviews");
        const data = await res.json();
        setSessions(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchSessions();
    }
  }, [userId, getToken]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4 bg-red-50 rounded-lg">
        {error}
      </div>
    );
  }

  if (sessions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-neutral-900">Your Recent Interviews</h3>
      <div className="grid gap-4 md:grid-cols-2">
        {sessions.map((session) => (
          <Card key={session.id} className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex justify-between items-center">
                <span>{session.role}</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  session.status === "COMPLETED" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                }`}>
                  {session.status}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-500 mb-4">
                Level: {session.experienceLevel} • Style: {session.style}
                <br/>
                Date: {new Date(session.createdAt).toLocaleDateString()}
              </p>
              
              {session.status === "COMPLETED" ? (
                session.evaluation ? (
                  <Button 
                    variant="outline" 
                    className="w-full justify-between border-green-200 hover:bg-green-50"
                    onClick={() => router.push(`/evaluation/${session.id}`)}
                  >
                    View Evaluation <CheckCircle className="w-4 h-4 ml-2 text-green-600" />
                  </Button>
                ) : (
                  <Button 
                    className="w-full justify-between"
                    onClick={() => router.push(`/interview/${session.id}`)}
                  >
                    Generate Evaluation <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )
              ) : (
                <Button 
                  variant="outline"
                  className="w-full justify-between text-blue-600 border-blue-200 hover:bg-blue-50"
                  onClick={() => router.push(`/interview/${session.id}`)}
                >
                  Continue Interview <Play className="w-4 h-4 ml-2" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

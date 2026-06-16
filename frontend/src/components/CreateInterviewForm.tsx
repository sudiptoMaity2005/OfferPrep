"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateInterviewForm() {
  const router = useRouter();
  const { getToken, userId } = useAuth();
  const [role, setRole] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [style, setStyle] = useState("Standard");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role || !experienceLevel) {
      setError("Please select both a role and experience level.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const token = await getToken();
      const res = await fetch("http://localhost:5001/api/interviews/create", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ role, experienceLevel, style, userId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create interview");
      }

      // Redirect to the interview room
      router.push(`/interview/${data.sessionId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">New Interview Session</CardTitle>
        <CardDescription>
          Tell us about the role you are preparing for, and our AI will generate tailored questions.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {error && <div className="text-red-500 text-sm font-medium">{error}</div>}
          
          <div className="space-y-2">
            <Label htmlFor="role">Target Role</Label>
            <Select onValueChange={setRole} value={role}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Software Development Engineer">Software Development Engineer (SDE)</SelectItem>
                <SelectItem value="Frontend Engineer">Frontend Engineer</SelectItem>
                <SelectItem value="Backend Engineer">Backend Engineer</SelectItem>
                <SelectItem value="Full Stack Engineer">Full Stack Engineer</SelectItem>
                <SelectItem value="Mobile Developer">Mobile Developer (iOS/Android)</SelectItem>
                <SelectItem value="Data Scientist">Data Scientist</SelectItem>
                <SelectItem value="Machine Learning Engineer">Machine Learning Engineer</SelectItem>
                <SelectItem value="Product Manager">Product Manager</SelectItem>
                <SelectItem value="DevOps/SRE">DevOps / SRE</SelectItem>
                <SelectItem value="UI/UX Designer">UI/UX Designer</SelectItem>
                <SelectItem value="Data Engineer">Data Engineer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience">Experience Level</Label>
            <Select onValueChange={setExperienceLevel} value={experienceLevel}>
              <SelectTrigger id="experience">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Intern">Intern</SelectItem>
                <SelectItem value="Fresher">Fresher / Junior (0-2 years)</SelectItem>
                <SelectItem value="Mid-Level">Mid-Level (3-5 years)</SelectItem>
                <SelectItem value="Senior">Senior (5+ years)</SelectItem>
                <SelectItem value="Lead">Lead / Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="style">Interview Style</Label>
            <Select onValueChange={setStyle} value={style}>
              <SelectTrigger id="style">
                <SelectValue placeholder="Select interview style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Friendly">Friendly Beginner</SelectItem>
                <SelectItem value="Standard">Standard</SelectItem>
                <SelectItem value="Strict">Strict / FAANG</SelectItem>
                <SelectItem value="Company Specific">Company Specific</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {style === "Friendly" && "Encouraging and supportive for first-time interviewees."}
              {style === "Standard" && "A typical technical interview experience."}
              {style === "Strict" && "Rigorous and deeply technical, like top tech companies."}
              {style === "Company Specific" && "We will adapt to standard top-tier company practices."}
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Generating Questions..." : "Start Interview"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

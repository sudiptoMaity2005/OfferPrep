"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiClient, ApiError } from "@/lib/api-client";
import { Building2, FileText, Sliders } from "lucide-react";

export function CreateInterviewForm() {
  const router = useRouter();
  const { getToken, userId } = useAuth();
  const [role, setRole] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [style, setStyle] = useState("Standard");
  const [company, setCompany] = useState("General");
  const [timePerQuestion, setTimePerQuestion] = useState("3");
  const [resumeText, setResumeText] = useState("");
  const [showResumeInput, setShowResumeInput] = useState(false);
  const [isAdaptive, setIsAdaptive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role || !experienceLevel) {
      toast.error("Please select both a role and experience level.");
      return;
    }

    setIsLoading(true);

    try {
      const token = await getToken();
      const data = await apiClient.createInterview(
        {
          role,
          experienceLevel,
          style,
          company,
          resumeText: resumeText.trim() || undefined,
          isAdaptive,
          timePerQuestion: parseInt(timePerQuestion, 10),
          userId: userId || "",
        },
        token
      );

      toast.success("Interview session generated! Redirecting to room...");
      router.push(`/interview/${data.sessionId}`);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.details?.length) {
        toast.error(`Validation: ${err.details.join(", ")}`);
      } else {
        const message = err instanceof Error ? err.message : "Something went wrong";
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-md border-neutral-200 dark:border-neutral-800">
      <CardHeader>
        <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          <Sliders className="w-3.5 h-3.5" />
          <span>Session Parameters</span>
        </div>
        <CardTitle className="text-2xl font-bold">New Interview Session</CardTitle>
        <CardDescription>
          Specify your role, target company, and optional resume details for a customized session.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-5">
          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">Target Role</Label>
            <Select onValueChange={(v) => setRole(v ?? "")} value={role}>
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

          {/* Level & Company */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="experience">Seniority Level</Label>
              <Select onValueChange={(v) => setExperienceLevel(v ?? "")} value={experienceLevel}>
                <SelectTrigger id="experience">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Intern">Intern</SelectItem>
                  <SelectItem value="Fresher">Fresher / Junior (0-2y)</SelectItem>
                  <SelectItem value="Mid-Level">Mid-Level (3-5y)</SelectItem>
                  <SelectItem value="Senior">Senior (5+y)</SelectItem>
                  <SelectItem value="Lead">Lead / Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company" className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-neutral-500" />
                <span>Company Track</span>
              </Label>
              <Select onValueChange={(v) => setCompany(v ?? "General")} value={company}>
                <SelectTrigger id="company">
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General Tech Bar</SelectItem>
                  <SelectItem value="Google">Google (Algorithmic / Systems)</SelectItem>
                  <SelectItem value="Amazon">Amazon (LP & Scalability)</SelectItem>
                  <SelectItem value="Meta">Meta (Fast execution & Scale)</SelectItem>
                  <SelectItem value="Microsoft">Microsoft (Architecture & Design)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Style & Timer */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="style">Interview Style</Label>
              <Select onValueChange={(v) => setStyle(v ?? "Standard")} value={style}>
                <SelectTrigger id="style">
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Friendly">Friendly / Encouraging</SelectItem>
                  <SelectItem value="Standard">Standard Rigor</SelectItem>
                  <SelectItem value="Strict">Strict FAANG Bar</SelectItem>
                  <SelectItem value="Company Specific">Company Specific</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timePerQuestion">Time per Question</Label>
              <Select onValueChange={(v) => setTimePerQuestion(v ?? "3")} value={timePerQuestion}>
                <SelectTrigger id="timePerQuestion">
                  <SelectValue placeholder="Timer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Minutes</SelectItem>
                  <SelectItem value="3">3 Minutes</SelectItem>
                  <SelectItem value="5">5 Minutes</SelectItem>
                  <SelectItem value="0">No Limit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Adaptive Probe Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                Adaptive Follow-Up Probing
              </p>
              <p className="text-[11px] text-muted-foreground">
                Enables technical follow-up questions that probe deeper into your answers.
              </p>
            </div>
            <input
              type="checkbox"
              id="adaptiveToggle"
              checked={isAdaptive}
              onChange={(e) => setIsAdaptive(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </div>

          {/* Optional Resume Section */}
          <div className="space-y-2 pt-1 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => setShowResumeInput(!showResumeInput)}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              {showResumeInput ? "Hide Resume Context" : "+ Add Resume / Project Highlights"}
            </button>

            {showResumeInput && (
              <div className="space-y-1.5 animate-in fade-in duration-300">
                <Textarea
                  placeholder="Paste your resume summary, tech stack, or major project highlights here (e.g. 'Built distributed event pipeline in Go with Kafka, optimized PostgreSQL indexes, deployed on Kubernetes...')"
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  className="min-h-[110px] text-xs p-3 font-mono"
                />
                <p className="text-[11px] text-muted-foreground">
                  Questions will reference the projects and technical claims listed above.
                </p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full font-semibold" disabled={isLoading}>
            {isLoading ? "Preparing Questions..." : "Create & Start Interview"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

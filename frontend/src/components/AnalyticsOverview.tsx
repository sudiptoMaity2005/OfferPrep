"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, Award, Target, CheckCircle2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import type { AnalyticsData } from "@/types";

export function AnalyticsOverview() {
  const { getToken, userId } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!userId) return;
      try {
        const token = await getToken();
        const data = await apiClient.fetchAnalytics(userId, token);
        setAnalytics(data);
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [userId, getToken]);

  if (loading) {
    return (
      <div className="space-y-4 mb-8">
        <Skeleton className="h-7 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!analytics || analytics.completedSessions === 0) {
    return null;
  }

  const statCards = [
    {
      label: "Interviews Completed",
      value: analytics.completedSessions,
      icon: CheckCircle2,
      color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-100 dark:border-blue-900",
    },
    {
      label: "Average Overall",
      value: `${analytics.averageOverallScore}%`,
      icon: Award,
      color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-100 dark:border-emerald-900",
    },
    {
      label: "Technical Depth",
      value: `${analytics.averageTechnicalScore}%`,
      icon: Target,
      color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border-purple-100 dark:border-purple-900",
    },
    {
      label: "Communication",
      value: `${analytics.averageCommunicationScore}%`,
      icon: TrendingUp,
      color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-100 dark:border-amber-900",
    },
  ];

  return (
    <div className="space-y-6 mb-10">
      <div>
        <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">Your Performance Analytics</h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Track your score trajectory across mock interview rounds.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="shadow-sm border-neutral-200 dark:border-neutral-800">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">{stat.label}</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">{stat.value}</p>
                </div>
                <div className={`p-2.5 rounded-xl border ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Score Progress Chart */}
      {analytics.history.length > 1 && (
        <Card className="shadow-sm border-neutral-200 dark:border-neutral-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Score Trajectory Over Time
            </CardTitle>
            <CardDescription className="text-xs">
              Overall and Technical performance over sequential interview sessions.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.history} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#88888820" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-card p-2.5 border border-border rounded-lg shadow-md text-xs space-y-1">
                            <p className="font-bold text-foreground">{data.role}</p>
                            <p className="text-blue-600 font-medium">Overall: {data.overallScore}%</p>
                            <p className="text-purple-600 font-medium">Technical: {data.technicalScore}%</p>
                            <p className="text-muted-foreground text-[10px]">{data.date}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="overallScore"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#2563eb" }}
                    activeDot={{ r: 6 }}
                    name="Overall Score"
                  />
                  <Line
                    type="monotone"
                    dataKey="technicalScore"
                    stroke="#9333ea"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 3, fill: "#9333ea" }}
                    name="Technical Depth"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <Card className="w-full max-w-md shadow-lg border-rose-200 dark:border-rose-900 text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center mb-2">
                <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
              <CardTitle className="text-xl font-bold">
                {this.props.fallbackTitle || "Something went wrong"}
              </CardTitle>
              <CardDescription className="text-sm">
                An unexpected interface error occurred. You can retry or return to your dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error?.message && (
                <div className="p-3 bg-muted rounded-md text-xs font-mono text-left overflow-auto max-h-24">
                  {this.state.error.message}
                </div>
              )}
              <div className="flex justify-center gap-3">
                <Button onClick={this.handleReset} variant="outline" size="sm" className="gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" /> Retry Component
                </Button>
                <Button onClick={() => (window.location.href = "/dashboard")} size="sm">
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}


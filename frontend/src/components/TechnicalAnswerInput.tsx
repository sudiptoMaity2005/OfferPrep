"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Code2, MessageSquare, Braces, Sparkles, Copy, Check } from "lucide-react";

interface TechnicalAnswerInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const SUPPORTED_LANGUAGES = [
  { label: "TypeScript", value: "typescript", template: "// Write your TypeScript solution here\nfunction solution() {\n  \n}\n" },
  { label: "Python", value: "python", template: "# Write your Python solution here\ndef solution():\n    pass\n" },
  { label: "Go", value: "go", template: "// Write your Go solution here\npackage main\n\nfunc solution() {\n    \n}\n" },
  { label: "Java", value: "java", template: "// Write your Java solution here\npublic class Solution {\n    public void solve() {\n        \n    }\n}\n" },
  { label: "SQL", value: "sql", template: "-- Write your SQL query here\nSELECT \nFROM \nWHERE ;\n" },
];

export function TechnicalAnswerInput({
  value,
  onChange,
  disabled = false,
}: TechnicalAnswerInputProps) {
  const [activeTab, setActiveTab] = useState<"explanation" | "code">("explanation");
  const [selectedLanguage, setSelectedLanguage] = useState("typescript");
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Tab key interceptor for code indentation (prevents losing focus)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      // Insert 2 spaces
      const updatedValue = value.substring(0, start) + "  " + value.substring(end);
      onChange(updatedValue);

      // Restore cursor position after state update
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  const insertLanguageTemplate = (langValue: string) => {
    const lang = SUPPORTED_LANGUAGES.find((l) => l.value === langValue);
    if (!lang) return;

    const block = `\n\`\`\`${lang.value}\n${lang.template}\`\`\`\n`;
    onChange(value ? `${value.trim()}\n${block}` : block.trim());
    setActiveTab("code");
  };

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const lineCount = value.split("\n").length;

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-card overflow-hidden shadow-xs transition-colors">
      {/* Editor Mode Header */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/60 gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("explanation")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
              activeTab === "explanation"
                ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs border border-neutral-200 dark:border-neutral-700"
                : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Explanation Mode</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("code")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
              activeTab === "code"
                ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs border border-neutral-200 dark:border-neutral-700"
                : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Code Sandbox Mode</span>
          </button>
        </div>

        {/* Quick Insert Language Selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedLanguage}
            onChange={(e) => {
              setSelectedLanguage(e.target.value);
              insertLanguageTemplate(e.target.value);
            }}
            className="text-xs font-mono font-medium bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md px-2 py-1 text-neutral-700 dark:text-neutral-300 focus:outline-hidden"
          >
            <option value="" disabled>+ Insert Template</option>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleCopy}
            className="p-1 rounded-md text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors"
            title="Copy answer to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            activeTab === "code"
              ? "// Code Sandbox: Tab key indents by 2 spaces.\n// Write code, data structures, algorithms, or SQL queries here..."
              : "Speak your thoughts aloud or type your answer here. You can freely switch to 'Code Sandbox Mode' to write code snippets, architecture diagrams, or trade-off tables."
          }
          className={`min-h-[260px] text-sm p-4 border-none shadow-none focus-visible:ring-0 resize-y leading-relaxed ${
            activeTab === "code"
              ? "font-mono bg-neutral-900 text-neutral-100 selection:bg-neutral-700 dark:bg-neutral-950"
              : "font-sans bg-transparent text-foreground"
          }`}
        />
      </div>

      {/* Editor Footer Status Bar */}
      <div className="px-3 py-1.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/60 flex items-center justify-between text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center gap-3">
          <span>{lineCount} {lineCount === 1 ? "line" : "lines"}</span>
          <span>•</span>
          <span>{value.length} chars</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline">Press [Tab] to indent 2 spaces</span>
          <span>•</span>
          <span className="capitalize">{activeTab} view</span>
        </div>
      </div>
    </div>
  );
}


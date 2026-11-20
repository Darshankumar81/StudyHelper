"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Wand2,
  CalendarCheck2,
} from "lucide-react";

export function GeneratePlanButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
    canFallback?: boolean;
  } | null>(null);

  async function handleGenerate(allowFallback = false) {
    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/generate-schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ allowFallback }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatusMessage({
          type: "success",
          text: `Success! Created ${data.count} study sessions using ${data.source === "gemini-3.8-flash" ? "Gemini 3.8 Flash" : "Intelligent Exam Engine"}.`,
        });
        // Refresh the server components to display new tasks
        router.refresh();
      } else {
        setStatusMessage({
          type: "error",
          text: data.error || "Failed to generate study schedule.",
          canFallback: Boolean(data.missingKey),
        });
      }
    } catch (err: any) {
      console.error("AI schedule generation error:", err);
      setStatusMessage({
        type: "error",
        text: err.message || "Network error. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start sm:items-end gap-2">
      <div className="flex items-center gap-2">
        <Button
          onClick={() => handleGenerate(false)}
          disabled={loading}
          size="lg"
          className="relative group overflow-hidden bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 hover:from-amber-600 hover:via-purple-700 hover:to-indigo-700 text-white font-bold shadow-lg shadow-purple-500/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-white/20"
        >
          {/* Subtle sheen highlight */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2 text-white" />
              <span>Synthesizing Plan...</span>
            </>
          ) : (
            <>
              <Sparkles className="size-4 mr-2 text-amber-300 animate-pulse" />
              <span>Generate AI Study Plan</span>
            </>
          )}
        </Button>
      </div>

      {statusMessage && (
        <div
          className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border animate-in fade-in slide-in-from-top-1 ${
            statusMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="size-3.5 shrink-0" />
          ) : (
            <AlertCircle className="size-3.5 shrink-0" />
          )}
          <span>{statusMessage.text}</span>

          {statusMessage.canFallback && (
            <button
              onClick={() => handleGenerate(true)}
              className="ml-1 underline font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              Generate Demo Plan
            </button>
          )}
        </div>
      )}
    </div>
  );
}

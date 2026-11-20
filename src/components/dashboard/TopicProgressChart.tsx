"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CheckCircle2, Circle, TrendingUp } from "lucide-react";

interface TopicProgressChartProps {
  completedTopics: number;
  totalTopics: number;
  subjectBreakdown: Array<{
    name: string;
    completed: number;
    total: number;
    percentage: number;
  }>;
}

export function TopicProgressChart({
  completedTopics,
  totalTopics,
  subjectBreakdown,
}: TopicProgressChartProps) {
  const remainingTopics = Math.max(0, totalTopics - completedTopics);
  const percentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  const data = [
    { name: "Completed Topics", value: completedTopics, color: "#10b981" },
    { name: "Remaining Topics", value: remainingTopics, color: "#94a3b8" },
  ];

  return (
    <div className="flex flex-col h-full justify-between">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Donut Chart */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
          <div className="h-56 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={88}
                  paddingAngle={totalTopics > 0 && completedTopics > 0 && remainingTopics > 0 ? 4 : 0}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      className="transition-all duration-300 hover:opacity-80"
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0];
                      return (
                        <div className="rounded-lg border border-border bg-card p-2 text-xs shadow-md">
                          <p className="font-semibold text-foreground">{item.name}</p>
                          <p className="text-muted-foreground">{item.value} topics</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center percentage indicator */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-extrabold tracking-tight text-foreground font-heading">
                {percentage}%
              </span>
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Completed
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6 mt-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-emerald-500 shadow-sm" />
              <span className="text-muted-foreground">
                Done ({completedTopics})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-slate-400 dark:bg-slate-600 shadow-sm" />
              <span className="text-muted-foreground">
                Remaining ({remainingTopics})
              </span>
            </div>
          </div>
        </div>

        {/* Breakdown by Subject */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <TrendingUp className="size-4 text-indigo-500" />
              <span>Subject Progress Breakdown</span>
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {completedTopics} of {totalTopics} topics mastered
            </span>
          </div>

          <div className="space-y-3.5">
            {subjectBreakdown.map((subj) => (
              <div key={subj.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground truncate max-w-[200px] sm:max-w-xs">
                    {subj.name}
                  </span>
                  <div className="flex items-center gap-2 tabular-nums">
                    <span className="text-muted-foreground text-[11px]">
                      {subj.completed}/{subj.total} topics
                    </span>
                    <span className="font-semibold text-foreground">
                      {subj.percentage}%
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
                    style={{ width: `${subj.percentage}%` }}
                  />
                </div>
              </div>
            ))}

            {subjectBreakdown.length === 0 && (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No subjects or topics created yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

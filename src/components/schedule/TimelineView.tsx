"use client";

import { useState } from "react";
import { TaskItem } from "@/components/schedule/TaskItem";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  ListFilter,
  Search,
  Calendar,
} from "lucide-react";

interface TaskWithDetails {
  id: string;
  title: string;
  date: Date | string;
  durationHours: number;
  isCompleted: boolean;
  topic: {
    id: string;
    title: string;
    subject: {
      id: string;
      name: string;
    };
  };
}

export function TimelineView({ tasks }: { tasks: TaskWithDetails[] }) {
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [search, setSearch] = useState("");

  const filteredTasks = tasks.filter((task) => {
    if (filter === "pending" && task.isCompleted) return false;
    if (filter === "completed" && !task.isCompleted) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchTopic = task.topic.title.toLowerCase().includes(q);
      const matchSubject = task.topic.subject.name.toLowerCase().includes(q);
      return matchTitle || matchTopic || matchSubject;
    }
    return true;
  });

  // Group tasks by calendar date (YYYY-MM-DD in local time)
  const groupedTasks: Record<string, TaskWithDetails[]> = {};
  filteredTasks.forEach((task) => {
    const d = new Date(task.date);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
    if (!groupedTasks[dateKey]) {
      groupedTasks[dateKey] = [];
    }
    groupedTasks[dateKey].push(task);
  });

  // Sort dates chronologically
  const sortedDates = Object.keys(groupedTasks).sort();

  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;

  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowKey = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(
    tomorrow.getDate()
  ).padStart(2, "0")}`;

  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(
    yesterday.getDate()
  ).padStart(2, "0")}`;

  function formatDayHeading(dateKey: string) {
    const [year, month, day] = dateKey.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day);

    const formattedDate = dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    if (dateKey === todayKey) return `Today — ${formattedDate}`;
    if (dateKey === tomorrowKey) return `Tomorrow — ${formattedDate}`;
    if (dateKey === yesterdayKey) return `Yesterday — ${formattedDate}`;
    return formattedDate;
  }

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-card p-1 rounded-xl border border-border">
          <Button
            size="sm"
            variant={filter === "all" ? "default" : "ghost"}
            onClick={() => setFilter("all")}
            className="text-xs h-7 px-3 rounded-lg"
          >
            All ({tasks.length})
          </Button>
          <Button
            size="sm"
            variant={filter === "pending" ? "default" : "ghost"}
            onClick={() => setFilter("pending")}
            className="text-xs h-7 px-3 rounded-lg"
          >
            Pending ({tasks.filter((t) => !t.isCompleted).length})
          </Button>
          <Button
            size="sm"
            variant={filter === "completed" ? "default" : "ghost"}
            onClick={() => setFilter("completed")}
            className="text-xs h-7 px-3 rounded-lg"
          >
            Completed ({tasks.filter((t) => t.isCompleted).length})
          </Button>
        </div>

        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search tasks, topics, courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs w-full sm:w-64 bg-background text-foreground border-border"
          />
        </div>
      </div>

      {/* Chronological Day-by-Day Timeline */}
      {sortedDates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card text-card-foreground p-12 text-center">
          <CalendarDays className="size-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-base font-semibold text-foreground">No tasks scheduled</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {search
              ? "No tasks match your current filter query."
              : "Use the Schedule Study Session button to plan your daily study goals."}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedDates.map((dateKey) => {
            const dayTasks = groupedTasks[dateKey];
            const totalDayHours = dayTasks.reduce(
              (acc, curr) => acc + curr.durationHours,
              0
            );
            const dayCompleted = dayTasks.filter((t) => t.isCompleted).length;
            const isAllCompleted = dayCompleted === dayTasks.length;
            const isToday = dateKey === todayKey;

            return (
              <div key={dateKey} className="space-y-3">
                {/* Day Header Banner */}
                <div
                  className={`flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border ${
                    isToday
                      ? "bg-indigo-500/10 border-indigo-500/30 text-card-foreground shadow-sm"
                      : "bg-card border-border text-card-foreground shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className={`size-4 ${isToday ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground"}`} />
                    <span className="font-heading font-bold text-sm tracking-tight text-foreground">
                      {formatDayHeading(dateKey)}
                    </span>
                    {isToday && (
                      <Badge className="bg-indigo-600 text-white text-[10px] px-1.5 py-0">
                        Current Day
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5 text-indigo-500" />
                      {totalDayHours} hrs scheduled
                    </span>
                    <span>•</span>
                    <span
                      className={`flex items-center gap-1 ${
                        isAllCompleted ? "text-emerald-600 font-semibold" : ""
                      }`}
                    >
                      <CheckCircle2 className="size-3.5 text-emerald-500" />
                      {dayCompleted}/{dayTasks.length} done
                    </span>
                  </div>
                </div>

                {/* Day Tasks List */}
                <div className="space-y-2.5 pl-2 sm:pl-4 border-l-2 border-indigo-500/20">
                  {dayTasks.map((task) => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

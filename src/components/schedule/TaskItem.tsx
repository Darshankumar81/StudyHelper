"use client";

import { useTransition, useState } from "react";
import { toggleTaskCompletion, deleteTask } from "@/app/actions";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, Trash2, Loader2, CheckCircle2 } from "lucide-react";

interface TaskItemProps {
  task: {
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
  };
}

export function TaskItem({ task }: TaskItemProps) {
  const [isPending, startTransition] = useTransition();
  const [completed, setCompleted] = useState(task.isCompleted);
  const [isDeleting, setIsDeleting] = useState(false);

  function handleToggle(checked: boolean) {
    setCompleted(checked);
    startTransition(async () => {
      await toggleTaskCompletion(task.id, checked);
    });
  }

  async function handleDelete() {
    setIsDeleting(true);
    await deleteTask(task.id);
    setIsDeleting(false);
  }

  const taskTime = new Date(task.date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`group flex items-center justify-between gap-3 rounded-xl border border-border p-3.5 transition-all ${
        completed
          ? "bg-muted/40 text-muted-foreground opacity-80"
          : "bg-card text-card-foreground hover:border-indigo-500/40 hover:shadow-sm"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex items-center justify-center shrink-0">
          <Checkbox
            checked={completed}
            disabled={isPending}
            onCheckedChange={(checked) => handleToggle(Boolean(checked))}
            id={`task-${task.id}`}
            className="size-5 rounded-md"
          />
        </div>

        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center rounded-md bg-indigo-500/10 px-2 py-0.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
              {task.topic.subject.name}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {task.topic.title}
            </span>
          </div>

          <label
            htmlFor={`task-${task.id}`}
            className={`block truncate text-sm font-semibold select-none cursor-pointer transition-all ${
              completed
                ? "line-through text-muted-foreground"
                : "text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
            }`}
          >
            {task.title}
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium bg-muted rounded-lg px-2.5 py-1 border border-border">
          <Clock className="size-3.5 text-indigo-500" />
          <span>{task.durationHours}h</span>
          <span className="text-muted-foreground/50">•</span>
          <span>{taskTime}</span>
        </div>

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
          title="Delete task"
        >
          {isDeleting ? (
            <Loader2 className="size-3.5 animate-spin text-destructive" />
          ) : (
            <Trash2 className="size-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}

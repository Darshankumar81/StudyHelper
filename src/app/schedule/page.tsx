import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TimelineView } from "@/components/schedule/TimelineView";
import { AddTaskDialog } from "@/components/schedule/AddTaskDialog";
import { CalendarDays } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const tasks = await prisma.task.findMany({
    where: {
      topic: {
        subject: {
          userId: user.id,
        },
      },
    },
    include: {
      topic: {
        include: {
          subject: true,
        },
      },
    },
    orderBy: { date: "asc" },
  });

  const subjects = await prisma.subject.findMany({
    where: { userId: user.id },
    include: {
      topics: {
        orderBy: { title: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.isCompleted).length;
  const pendingTasks = totalTasks - completedTasks;
  const totalHoursScheduled = tasks.reduce(
    (acc, curr) => acc + curr.durationHours,
    0
  );
  const completedHours = tasks
    .filter((t) => t.isCompleted)
    .reduce((acc, curr) => acc + curr.durationHours, 0);

  return (
    <div className="min-h-full bg-background text-foreground space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <CalendarDays className="size-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading text-foreground">
              Calendar & Timeline
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Day-by-day chronological view of your study sessions, practice sets, and milestones.
          </p>
        </div>

        <AddTaskDialog subjects={subjects} />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card text-card-foreground p-4 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Sessions
          </span>
          <div className="text-2xl font-bold font-heading mt-1 text-foreground">{totalTasks}</div>
          <p className="text-xs text-muted-foreground mt-0.5">Scheduled activities</p>
        </div>

        <div className="rounded-xl border border-border bg-card text-card-foreground p-4 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Completed
          </span>
          <div className="text-2xl font-bold font-heading mt-1 text-emerald-600 dark:text-emerald-400">
            {completedTasks}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% success rate
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card text-card-foreground p-4 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Pending Tasks
          </span>
          <div className="text-2xl font-bold font-heading mt-1 text-amber-600 dark:text-amber-400">
            {pendingTasks}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Awaiting completion</p>
        </div>

        <div className="rounded-xl border border-border bg-card text-card-foreground p-4 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Study Hours
          </span>
          <div className="text-2xl font-bold font-heading mt-1 text-foreground">
            {completedHours}/{totalHoursScheduled}h
          </div>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
            Logged focus time
          </p>
        </div>
      </div>

      {/* Day-by-Day Timeline */}
      <TimelineView tasks={tasks} />
    </div>
  );
}

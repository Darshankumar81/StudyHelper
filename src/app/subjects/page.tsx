import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AddSubjectDialog } from "@/components/subjects/AddSubjectDialog";
import { SubjectCard } from "@/components/subjects/SubjectCard";
import { Card } from "@/components/ui/card";
import { BookOpen, Library } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SubjectsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const subjects = await prisma.subject.findMany({
    where: { userId: user.id },
    include: {
      topics: {
        orderBy: { createdAt: "asc" },
      },
      exams: {
        orderBy: { date: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const totalTopics = subjects.reduce((acc, s) => acc + s.topics.length, 0);
  const completedTopics = subjects.reduce(
    (acc, s) => acc + s.topics.filter((t) => t.isCompleted).length,
    0
  );
  const totalHours = subjects.reduce((acc, s) => acc + s.totalHoursNeeded, 0);
  const totalExams = subjects.reduce((acc, s) => acc + s.exams.length, 0);

  return (
    <div className="min-h-full bg-background text-foreground space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Library className="size-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading text-foreground">
              Curriculum & Subjects
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage your academic subjects, define modular study topics, and register exam milestones.
          </p>
        </div>

        <AddSubjectDialog />
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card text-card-foreground p-4 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Subjects
          </span>
          <div className="text-2xl font-bold font-heading mt-1 text-foreground">{subjects.length}</div>
          <p className="text-xs text-muted-foreground mt-0.5">Enrolled courses</p>
        </div>

        <div className="rounded-xl border border-border bg-card text-card-foreground p-4 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Curriculum Topics
          </span>
          <div className="text-2xl font-bold font-heading mt-1 text-foreground">
            {completedTopics}/{totalTopics}
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
            {totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0}% completion
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card text-card-foreground p-4 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Workload
          </span>
          <div className="text-2xl font-bold font-heading mt-1 text-foreground">{totalHours} hrs</div>
          <p className="text-xs text-muted-foreground mt-0.5">Estimated study hours</p>
        </div>

        <div className="rounded-xl border border-border bg-card text-card-foreground p-4 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Exams Scheduled
          </span>
          <div className="text-2xl font-bold font-heading mt-1 text-foreground">{totalExams}</div>
          <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-0.5">Upcoming deadlines</p>
        </div>
      </div>

      {/* Subjects Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
          <BookOpen className="size-4 text-indigo-600 dark:text-indigo-400" />
          Active Courses ({subjects.length})
        </h2>

        {subjects.length === 0 ? (
          <Card className="border-dashed border-border bg-card text-card-foreground p-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mx-auto mb-3">
              <BookOpen className="size-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">No subjects found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              Get started by creating your first subject to organize topics and schedule exams.
            </p>
            <div className="mt-4">
              <AddSubjectDialog />
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {subjects.map((subject) => (
              <SubjectCard key={subject.id} subject={subject} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { TopicProgressChart } from "@/components/dashboard/TopicProgressChart";
import { GeneratePlanButton } from "@/components/dashboard/GeneratePlanButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  Calendar,
  Clock,
  BookOpen,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Sparkles,
  ListTodo,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const subjects = await prisma.subject.findMany({
    where: { userId: user.id },
    include: {
      topics: true,
      exams: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const allTopics = subjects.flatMap((s) => s.topics);
  const totalTopics = allTopics.length;
  const completedTopics = allTopics.filter((t) => t.isCompleted).length;
  const topicPercentage =
    totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  const userTasks = await prisma.task.findMany({
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

  const totalTasksCount = userTasks.length;
  const completedTasksCount = userTasks.filter((t) => t.isCompleted).length;
  const taskPercentage =
    totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  const totalStudyHoursNeeded = subjects.reduce(
    (acc, curr) => acc + curr.totalHoursNeeded,
    0
  );

  const subjectBreakdown = subjects.map((subj) => {
    const total = subj.topics.length;
    const completed = subj.topics.filter((t) => t.isCompleted).length;
    return {
      name: subj.name,
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });

  const exams = await prisma.exam.findMany({
    where: {
      subject: {
        userId: user.id,
      },
    },
    include: {
      subject: true,
    },
    orderBy: { date: "asc" },
  });

  const upcomingTasks = userTasks.slice(0, 4);
  const now = new Date();

  return (
    <div className="min-h-full bg-background text-foreground space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card text-card-foreground p-6 sm:p-8 shadow-sm">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 size-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
              <Sparkles className="size-3.5 text-amber-500 fill-amber-500" />
              <span>Gemini AI Study Engine • {user.dailyStudyHours}h/day limit</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading text-foreground">
              Welcome back, {user.name} 👋
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl">
              Tracking <span className="font-semibold text-foreground">{subjects.length} subjects</span>,{" "}
              <span className="font-semibold text-foreground">{totalTopics} curriculum topics</span>, and{" "}
              <span className="font-semibold text-foreground">{totalTasksCount} planned tasks</span>.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <GeneratePlanButton />
            <div className="flex items-center gap-2">
              <Link href="/schedule">
                <Button variant="outline" className="border-border bg-card text-foreground hover:bg-muted font-medium shadow-sm">
                  <Calendar className="size-4 mr-2" />
                  Schedule
                </Button>
              </Link>
              <Link href="/subjects">
                <Button variant="outline" className="border-border bg-card text-foreground hover:bg-muted font-medium shadow-sm">
                  <BookOpen className="size-4 mr-2" />
                  Subjects
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Topic Mastery
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <CheckCircle className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground font-heading">
              {topicPercentage}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-medium text-emerald-600">{completedTopics}</span> of {totalTopics} topics completed
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Task Completion
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600">
              <ListTodo className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground font-heading">
              {taskPercentage}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-medium text-indigo-600">{completedTasksCount}</span> of {totalTasksCount} tasks done
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Upcoming Exams
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
              <GraduationCap className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground font-heading">
              {exams.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {exams.length > 0 ? `Next: ${exams[0].title}` : "No exams scheduled"}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Daily Capacity
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <Clock className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground font-heading">
              {user.dailyStudyHours} hrs/day
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              User study budget limit
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Chart and Upcoming Exams */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Recharts Topic Progress Overview */}
        <div className="lg:col-span-7">
          <Card className="border border-border bg-card text-card-foreground shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">Curriculum Mastery</CardTitle>
                  <CardDescription>
                    Real-time completed vs remaining topics ratio
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="font-medium text-xs">
                  {completedTopics}/{totalTopics} Topics Completed
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <TopicProgressChart
                completedTopics={completedTopics}
                totalTopics={totalTopics}
                subjectBreakdown={subjectBreakdown}
              />
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Exams Section (Sorted by date) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border border-border bg-card text-card-foreground shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <GraduationCap className="size-5 text-indigo-600" />
                  Upcoming Exams
                </CardTitle>
                <CardDescription>
                  Chronologically sorted exam milestones
                </CardDescription>
              </div>
              <Link href="/subjects">
                <Button variant="ghost" size="sm" className="text-xs text-indigo-600 hover:text-indigo-700">
                  Manage
                  <ArrowRight className="size-3.5 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {exams.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-6 text-center">
                  <AlertCircle className="size-8 mx-auto text-muted-foreground/60 mb-2" />
                  <p className="text-sm font-medium text-foreground">No upcoming exams</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add upcoming exam dates from the Subjects page.
                  </p>
                  <Link href="/subjects" className="inline-block mt-3">
                    <Button size="sm" variant="outline">
                      Add Exam
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {exams.map((exam) => {
                    const examDate = new Date(exam.date);
                    const diffDays = Math.ceil(
                      (examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                    );
                    const isUrgent = diffDays <= 7 && diffDays >= 0;
                    const isPast = diffDays < 0;

                    return (
                      <div
                        key={exam.id}
                        className="group relative flex flex-col gap-2 rounded-xl border border-border bg-card text-card-foreground p-4 transition-all hover:border-indigo-500/40 hover:shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <span className="inline-flex items-center rounded-md bg-indigo-500/10 px-2 py-0.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                              {exam.subject.name}
                            </span>
                            <h4 className="font-semibold text-sm text-foreground">
                              {exam.title}
                            </h4>
                          </div>

                          <span
                            className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                              isPast
                                ? "bg-muted text-muted-foreground"
                                : isUrgent
                                ? "bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20"
                                : "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20"
                            }`}
                          >
                            {isPast
                              ? "Completed"
                              : diffDays === 0
                              ? "Today!"
                              : diffDays === 1
                              ? "Tomorrow"
                              : `In ${diffDays} days`}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-border/50">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="size-3.5 text-muted-foreground/70" />
                            <span>
                              {examDate.toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="size-3.5 text-muted-foreground/70" />
                            <span>
                              {examDate.toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Study Schedule Glance */}
      <Card className="border border-border bg-card text-card-foreground shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Calendar className="size-5 text-indigo-600" />
              Immediate Study Agenda
            </CardTitle>
            <CardDescription>
              Tasks scheduled for your current study sprints
            </CardDescription>
          </div>
          <Link href="/schedule">
            <Button variant="outline" size="sm" className="text-xs border-border bg-card text-foreground hover:bg-muted">
              Open Full Timeline
              <ArrowRight className="size-3.5 ml-1.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {upcomingTasks.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-border rounded-xl">
              <p className="text-sm font-medium text-foreground">No active tasks</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create subjects and topics, then click "Generate AI Study Plan".
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {upcomingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex flex-col justify-between rounded-xl border border-border bg-card text-card-foreground p-3.5 transition-all hover:border-indigo-500/30 hover:shadow-sm"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                        {task.topic.subject.name}
                      </span>
                      <Badge
                        variant={task.isCompleted ? "secondary" : "outline"}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {task.isCompleted ? "Done" : "Pending"}
                      </Badge>
                    </div>
                    <p className="text-xs font-semibold text-foreground line-clamp-2">
                      {task.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      Topic: {task.topic.title}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-3 border-t border-border/50 mt-3">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3 text-muted-foreground" />
                      {task.durationHours} hrs
                    </span>
                    <span>
                      {new Date(task.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  createTopic,
  toggleTopicCompletion,
  deleteTopic,
  createExam,
  deleteExam,
  deleteSubject,
} from "@/app/actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  BookOpen,
  Calendar,
  Clock,
  Trash2,
  Plus,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface SubjectWithRelations {
  id: string;
  name: string;
  totalHoursNeeded: number;
  topics: Array<{
    id: string;
    title: string;
    isCompleted: boolean;
  }>;
  exams: Array<{
    id: string;
    title: string;
    date: Date | string;
  }>;
}

export function SubjectCard({ subject }: { subject: SubjectWithRelations }) {
  const [topicTitle, setTopicTitle] = useState("");
  const [isAddingTopic, setIsAddingTopic] = useState(false);

  const [examTitle, setExamTitle] = useState("");
  const [examDate, setExamDate] = useState("");
  const [isAddingExam, setIsAddingExam] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const totalTopics = subject.topics.length;
  const completedTopics = subject.topics.filter((t) => t.isCompleted).length;
  const progressPercent =
    totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  async function handleAddTopic(e: React.FormEvent) {
    e.preventDefault();
    if (!topicTitle.trim()) return;

    setIsAddingTopic(true);
    const formData = new FormData();
    formData.append("subjectId", subject.id);
    formData.append("title", topicTitle.trim());
    formData.append("isCompleted", "false");

    await createTopic(formData);
    setTopicTitle("");
    setIsAddingTopic(false);
  }

  async function handleAddExam(e: React.FormEvent) {
    e.preventDefault();
    if (!examTitle.trim() || !examDate) return;

    setIsAddingExam(true);
    const formData = new FormData();
    formData.append("subjectId", subject.id);
    formData.append("title", examTitle.trim());
    formData.append("date", examDate);

    await createExam(formData);
    setExamTitle("");
    setExamDate("");
    setIsAddingExam(false);
  }

  async function handleDeleteSubject() {
    if (confirm(`Are you sure you want to delete "${subject.name}" and all its topics/exams?`)) {
      setIsDeleting(true);
      await deleteSubject(subject.id);
      setIsDeleting(false);
    }
  }

  const now = new Date();

  return (
    <Card className="border border-border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md">
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <BookOpen className="size-4" />
              </span>
              <CardTitle className="text-xl font-bold tracking-tight text-card-foreground">
                {subject.name}
              </CardTitle>
            </div>
            <CardDescription className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 font-medium text-foreground">
                <Clock className="size-3.5 text-muted-foreground" />
                {subject.totalHoursNeeded} total hours needed
              </span>
              <span>•</span>
              <span>{totalTopics} topics</span>
              <span>•</span>
              <span>{subject.exams.length} exams</span>
            </CardDescription>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="size-8 p-0 text-muted-foreground hover:text-foreground"
              title={expanded ? "Collapse details" : "Expand details"}
            >
              {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteSubject}
              disabled={isDeleting}
              className="size-8 p-0 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
              title="Delete Subject"
            >
              {isDeleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-4" />}
            </Button>
          </div>
        </div>

        {/* Topic Mastery Progress Bar */}
        <div className="space-y-1.5 pt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Curriculum Progress</span>
            <span className="font-semibold text-foreground">
              {completedTopics}/{totalTopics} completed ({progressPercent}%)
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-4 space-y-6">
          {/* Topics Sub-section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-500" />
                Curriculum Topics ({totalTopics})
              </h4>
            </div>

            {subject.topics.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-1">
                No topics added yet. Add key topics to study.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {subject.topics.map((topic) => (
                  <div
                    key={topic.id}
                    className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-card text-card-foreground px-3 py-2 text-xs transition-colors hover:bg-muted/40"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <Checkbox
                        checked={topic.isCompleted}
                        onCheckedChange={(checked) =>
                          toggleTopicCompletion(topic.id, Boolean(checked))
                        }
                        id={`topic-${topic.id}`}
                      />
                      <label
                        htmlFor={`topic-${topic.id}`}
                        className={`truncate cursor-pointer font-medium select-none ${
                          topic.isCompleted
                            ? "line-through text-muted-foreground opacity-75"
                            : "text-card-foreground"
                        }`}
                      >
                        {topic.title}
                      </label>
                    </div>

                    <button
                      onClick={() => deleteTopic(topic.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
                      title="Delete topic"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Topic Inline Form */}
            <form onSubmit={handleAddTopic} className="flex items-center gap-2 pt-1">
              <Input
                placeholder="Add a topic (e.g. Memory Hierarchy, Sorting Algorithms)..."
                value={topicTitle}
                onChange={(e) => setTopicTitle(e.target.value)}
                disabled={isAddingTopic}
                className="h-8 text-xs flex-1 bg-background text-foreground border-border"
              />
              <Button
                type="submit"
                size="sm"
                disabled={isAddingTopic || !topicTitle.trim()}
                className="h-8 text-xs px-3 bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
              >
                {isAddingTopic ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3 mr-1" />}
                Add Topic
              </Button>
            </form>
          </div>

          {/* Exams Sub-section */}
          <div className="space-y-3 pt-3 border-t border-border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <GraduationCap className="size-3.5 text-purple-500" />
              Scheduled Exams ({subject.exams.length})
            </h4>

            {subject.exams.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-1">
                No exams scheduled for this subject.
              </p>
            ) : (
              <div className="space-y-2">
                {subject.exams.map((exam) => {
                  const examDateObj = new Date(exam.date);
                  const diffDays = Math.ceil(
                    (examDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                  );
                  const isUrgent = diffDays <= 7 && diffDays >= 0;

                  return (
                    <div
                      key={exam.id}
                      className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-card text-card-foreground px-3 py-2 text-xs transition-colors hover:bg-muted/40"
                    >
                      <div className="space-y-0.5">
                        <p className="font-semibold text-card-foreground text-xs">
                          {exam.title}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3 text-purple-500" />
                            {examDateObj.toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span>•</span>
                          <span
                            className={
                              isUrgent ? "text-amber-600 dark:text-amber-400 font-semibold" : ""
                            }
                          >
                            {diffDays < 0
                              ? "Completed"
                              : diffDays === 0
                              ? "Today"
                              : `In ${diffDays} days`}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => deleteExam(exam.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
                        title="Delete exam"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add Exam Inline Form */}
            <form onSubmit={handleAddExam} className="space-y-2 pt-1">
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <Input
                  placeholder="Exam title (e.g. Midterm, Final Exam)..."
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  disabled={isAddingExam}
                  className="h-8 text-xs flex-1"
                />
                <Input
                  type="datetime-local"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  disabled={isAddingExam}
                  className="h-8 text-xs sm:w-48"
                  required
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={isAddingExam || !examTitle.trim() || !examDate}
                  className="h-8 text-xs px-3 bg-purple-600 hover:bg-purple-700 text-white shrink-0 w-full sm:w-auto"
                >
                  {isAddingExam ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3 mr-1" />}
                  Schedule Exam
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

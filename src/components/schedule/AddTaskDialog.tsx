"use client";

import { useState } from "react";
import { createTask } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle, CalendarPlus, Clock, Loader2 } from "lucide-react";

interface SubjectWithTopics {
  id: string;
  name: string;
  topics: Array<{
    id: string;
    title: string;
  }>;
}

export function AddTaskDialog({ subjects }: { subjects: SubjectWithTopics[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // default date: tomorrow at 10:00 AM
  const defaultDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await createTask(formData);

    if (res.success) {
      setOpen(false);
    } else {
      setError(res.error || "Failed to schedule task");
    }
    setLoading(false);
  }

  const allTopicsCount = subjects.reduce((acc, s) => acc + s.topics.length, 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md font-semibold gap-2">
            <PlusCircle className="size-4" />
            Schedule Study Session
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 mb-2">
            <CalendarPlus className="size-5" />
          </div>
          <DialogTitle className="text-xl font-bold">Schedule Study Task</DialogTitle>
          <DialogDescription>
            Allocate dedicated focus time for a specific topic in your calendar.
          </DialogDescription>
        </DialogHeader>

        {allTopicsCount === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            Please add at least one topic under your Subjects first before scheduling tasks.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20 font-medium">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="topicId" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Target Topic
              </Label>
              <select
                id="topicId"
                name="topicId"
                required
                disabled={loading}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select a topic to study...</option>
                {subjects.map((s) => (
                  <optgroup key={s.id} label={s.name}>
                    {s.topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Task Description
              </Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g. Practice problem set 4, Deep dive flashcards"
                required
                disabled={loading}
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Date & Time
                </Label>
                <Input
                  id="date"
                  name="date"
                  type="datetime-local"
                  defaultValue={defaultDate}
                  required
                  disabled={loading}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="durationHours" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Duration (Hours)
                </Label>
                <Input
                  id="durationHours"
                  name="durationHours"
                  type="number"
                  step="0.5"
                  min="0.5"
                  defaultValue="1.5"
                  required
                  disabled={loading}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Scheduling...
                  </>
                ) : (
                  "Add to Schedule"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

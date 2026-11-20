"use client";

import { useState } from "react";
import { createSubject } from "@/app/actions";
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
import { PlusCircle, BookOpen, Clock, Loader2 } from "lucide-react";

export function AddSubjectDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await createSubject(formData);

    if (res.success) {
      setOpen(false);
    } else {
      setError(res.error || "Failed to create subject");
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md font-semibold gap-2">
            <PlusCircle className="size-4" />
            Add New Subject
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 mb-2">
            <BookOpen className="size-5" />
          </div>
          <DialogTitle className="text-xl font-bold">Create New Subject</DialogTitle>
          <DialogDescription>
            Add a course or subject to your curriculum and set its estimated study workload.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20 font-medium">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Subject Name
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Distributed Systems, Organic Chemistry"
              required
              disabled={loading}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalHoursNeeded" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Hours Needed
            </Label>
            <div className="relative">
              <Input
                id="totalHoursNeeded"
                name="totalHoursNeeded"
                type="number"
                step="0.5"
                min="1"
                placeholder="40"
                required
                disabled={loading}
                className="h-10 pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium pointer-events-none">
                hours
              </span>
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
                  Creating...
                </>
              ) : (
                "Save Subject"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

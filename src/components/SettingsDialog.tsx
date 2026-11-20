"use client";

import { useState } from "react";
import { updateUserSettings } from "@/app/actions";
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
import { Settings, Clock, Loader2, User } from "lucide-react";

interface SettingsDialogProps {
  user: {
    name: string;
    email: string;
    dailyStudyHours: number;
  };
  trigger?: React.ReactNode;
}

export function SettingsDialog({ user, trigger }: SettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const res = await updateUserSettings(formData);

    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
      }, 1000);
    } else {
      setError(res.error || "Failed to update study settings");
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ? (
            (trigger as any)
          ) : (
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="size-4" />
              Settings
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 mb-2">
            <Settings className="size-5" />
          </div>
          <DialogTitle className="text-xl font-bold">Study Settings & Capacity</DialogTitle>
          <DialogDescription>
            Configure your daily study capacity. The AI scheduling engine uses this limit to budget study tasks.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20 font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
              Settings updated successfully!
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Display Name
            </Label>
            <div className="relative">
              <Input
                id="name"
                name="name"
                defaultValue={user.name}
                required
                disabled={loading}
                className="h-10 pl-9"
              />
              <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dailyStudyHours" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Max Daily Study Hours
            </Label>
            <div className="relative">
              <Input
                id="dailyStudyHours"
                name="dailyStudyHours"
                type="number"
                min="1"
                max="24"
                defaultValue={user.dailyStudyHours || 5}
                required
                disabled={loading}
                className="h-10 pl-9 pr-16"
              />
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium pointer-events-none">
                hrs/day
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Maximum hours of focus study you plan to allocate per calendar day.
            </p>
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
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

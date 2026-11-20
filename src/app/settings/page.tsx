import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SettingsDialog } from "@/components/SettingsDialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Settings, Clock, User, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-full bg-background text-foreground space-y-8 max-w-3xl animate-in fade-in duration-300">
      <div className="space-y-1 border-b border-border pb-6">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Settings className="size-5" />
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading text-foreground">
            Account & Preferences
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage your account profile and daily study capacity settings.
        </p>
      </div>

      <Card className="border border-border bg-card text-card-foreground shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-card-foreground">
            <User className="size-5 text-indigo-600 dark:text-indigo-400" />
            Profile Information
          </CardTitle>
          <CardDescription className="text-muted-foreground">Your registered identity details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-card border border-border">
              <span className="font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Full Name
              </span>
              <span className="text-sm font-bold text-foreground">{user.name}</span>
            </div>

            <div className="p-3 rounded-lg bg-card border border-border">
              <span className="font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Email Address
              </span>
              <span className="text-sm font-bold text-foreground">{user.email}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border bg-card text-card-foreground shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Clock className="size-5 text-purple-600" />
            Daily Study Budget
          </CardTitle>
          <CardDescription>
            The Gemini AI engine uses this budget to schedule daily task durations without exceeding your capacity.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Target Capacity
              </span>
              <span className="text-2xl font-bold font-heading text-purple-600 dark:text-purple-400">
                {user.dailyStudyHours} Hours / Day
              </span>
            </div>

            <SettingsDialog user={user} />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
            <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
            <span>Changes take effect immediately for upcoming AI study plan generation.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

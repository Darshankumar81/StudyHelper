import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

export const dynamic = "force-dynamic";

const studySessionSchema = z.object({
  date: z.string().describe("ISO 8601 date string for the scheduled study session"),
  durationHours: z.number().describe("Duration in hours for the study session"),
  topicId: z.string().describe("ID of the curriculum topic"),
  title: z.string().describe("Descriptive title for the study session (e.g., Topic Name - Part 1)"),
});

const studyScheduleSchema = z.array(studySessionSchema);

interface IncompleteTopic {
  id: string;
  title: string;
  subjectId: string;
  subject: {
    id: string;
    name: string;
    totalHoursNeeded: number;
  };
}

interface UpcomingExam {
  id: string;
  title: string;
  date: Date;
  subjectId: string;
  subject: {
    id: string;
    name: string;
  };
}

/**
 * Normalizes sessions so that:
 * 1. No single calendar day ever exceeds the user's daily capacity.
 * 2. Start times on the same day are sequential and strictly non-overlapping (starting at 09:00 AM).
 * 3. Multi-session topics have sequential titles (Part 1, Part 2).
 */
function normalizeAndEnforceDailyBudget(
  rawSessions: Array<{ topicId: string; title: string; date?: string; durationHours: number }>,
  dailyCapacity: number,
  startDate: Date
): Array<{
  topicId: string;
  title: string;
  date: string;
  durationHours: number;
}> {
  const normalized: Array<{
    topicId: string;
    title: string;
    date: string;
    durationHours: number;
  }> = [];

  const topicCountMap = new Map<string, number>();

  let currentDate = new Date(startDate);
  currentDate.setHours(9, 0, 0, 0);

  let currentDayHoursUsed = 0;
  let currentDayTimeCursor = new Date(currentDate);

  for (const session of rawSessions) {
    const duration = Math.min(
      Math.max(0.5, session.durationHours || 1.5),
      dailyCapacity
    );

    // If adding this task exceeds dailyCapacity, increment to the next day
    if (currentDayHoursUsed + duration > dailyCapacity && currentDayHoursUsed > 0) {
      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
      currentDate.setHours(9, 0, 0, 0);
      currentDayTimeCursor = new Date(currentDate);
      currentDayHoursUsed = 0;
    }

    const sessionStartTime = new Date(currentDayTimeCursor);

    // Advance time cursor sequentially for subsequent tasks on this day
    const durationMs = duration * 60 * 60 * 1000;
    currentDayTimeCursor = new Date(currentDayTimeCursor.getTime() + durationMs);
    currentDayHoursUsed += duration;

    // Track duplicate topics and ensure Part 1, Part 2 nomenclature
    const count = (topicCountMap.get(session.topicId) ?? 0) + 1;
    topicCountMap.set(session.topicId, count);

    let title = session.title?.trim() || "Study Session";
    if (count > 1 && !title.toLowerCase().includes("part")) {
      title = `${title} (Part ${count})`;
    }

    normalized.push({
      topicId: session.topicId,
      title,
      date: sessionStartTime.toISOString(),
      durationHours: duration,
    });
  }

  return normalized;
}

function generateAlgorithmicSchedule(
  incompleteTopics: IncompleteTopic[],
  upcomingExams: UpcomingExam[],
  dailyCapacityHours: number,
  now: Date
) {
  const examMap = new Map<string, number>();
  upcomingExams.forEach((e) => {
    const diff = new Date(e.date).getTime() - now.getTime();
    if (!examMap.has(e.subjectId) || diff < examMap.get(e.subjectId)!) {
      examMap.set(e.subjectId, diff);
    }
  });

  const sortedTopics = [...incompleteTopics].sort((a, b) => {
    const timeA = examMap.get(a.subjectId) ?? Number.MAX_SAFE_INTEGER;
    const timeB = examMap.get(b.subjectId) ?? Number.MAX_SAFE_INTEGER;
    return timeA - timeB;
  });

  const rawSessions = sortedTopics.map((topic) => {
    const hasExamSoon = examMap.has(topic.subjectId);
    const titlePrefix = hasExamSoon ? "Exam Prep" : "Core Mastery";
    const duration = Math.min(2.0, dailyCapacityHours);

    return {
      topicId: topic.id,
      title: `${titlePrefix}: ${topic.title}`,
      durationHours: duration,
    };
  });

  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return normalizeAndEnforceDailyBudget(rawSessions, dailyCapacityHours, tomorrow);
}

function extractJsonArray(text: string): any[] {
  const trimmed = text.trim();
  const firstBracket = trimmed.indexOf("[");
  const lastBracket = trimmed.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    const jsonSubstring = trimmed.substring(firstBracket, lastBracket + 1);
    return JSON.parse(jsonSubstring);
  }
  return JSON.parse(trimmed);
}

export async function POST(req: Request) {
  try {
    // 1. Enforce Authentication
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in to generate study schedule." },
        { status: 401 }
      );
    }

    const dailyCapacity = user.dailyStudyHours || 4;

    // Fix 1: Auto-Clear Old Schedule
    // Delete all existing tasks for this user where isCompleted === false before generating new schedule
    await prisma.task.deleteMany({
      where: {
        isCompleted: false,
        topic: {
          subject: {
            userId: user.id,
          },
        },
      },
    });

    // 2. Fetch logged-in user's specific incomplete Topics and upcoming Exams
    const incompleteTopics = await prisma.topic.findMany({
      where: {
        isCompleted: false,
        subject: { userId: user.id },
      },
      include: {
        subject: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const now = new Date();

    const upcomingExams = await prisma.exam.findMany({
      where: {
        subject: { userId: user.id },
        date: { gte: now },
      },
      include: {
        subject: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    if (incompleteTopics.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No incomplete topics found in your curriculum. Add topics under Subjects to generate a study plan.",
        },
        { status: 400 }
      );
    }

    let body: { allowFallback?: boolean } = {};
    try {
      body = await req.json();
    } catch {
      // Body optional
    }

    const apiKey = process.env.GEMINI_API_KEY;

    let sessionsToCreate: Array<{
      topicId: string;
      title: string;
      date: string;
      durationHours: number;
    }> = [];

    let planSource = "gemini-3.8-flash";
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    tomorrow.setHours(9, 0, 0, 0);

    if (!apiKey) {
      if (body.allowFallback) {
        sessionsToCreate = generateAlgorithmicSchedule(incompleteTopics, upcomingExams, dailyCapacity, now);
        planSource = "smart-fallback";
      } else {
        return NextResponse.json(
          {
            success: false,
            error: "GEMINI_API_KEY is not configured in .env. Please set GEMINI_API_KEY in your .env file.",
            missingKey: true,
          },
          { status: 400 }
        );
      }
    } else {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const topicsPromptData = incompleteTopics.map((t) => ({
        topicId: t.id,
        topicTitle: t.title,
        subjectId: t.subjectId,
        subjectName: t.subject.name,
      }));

      const examsPromptData = upcomingExams.map((e) => ({
        examId: e.id,
        examTitle: e.title,
        examDate: e.date.toISOString(),
        subjectId: e.subjectId,
        subjectName: e.subject.name,
      }));

      // Fix 2: Strict Daily Limits & Fix 3: Prevent Duplicates & Overlaps
      const prompt = `You are an expert academic study planner and cognitive scientist.
Current Reference Time: ${now.toISOString()} (${now.toDateString()})
STUDENT DAILY STUDY CAPACITY BUDGET: Exactly ${dailyCapacity} hours per day.

The student has the following INCOMPLETE CURRICULUM TOPICS:
${JSON.stringify(topicsPromptData, null, 2)}

The student has the following UPCOMING EXAMS (sorted soonest first):
${JSON.stringify(examsPromptData, null, 2)}

STRICT SCHEDULING DIRECTIVES:
1. Daily Limit Directive: You MUST NOT schedule more than ${dailyCapacity} hours of tasks on a single date. If the required hours exceed the daily limit, you MUST increment the date to the next day.
2. Anti-Duplicate & Anti-Overlap Directive: Never create duplicate tasks. If a topic requires multiple study sessions, name them sequentially (e.g., Part 1, Part 2). Ensure start times are sequential on the same day and do not overlap.
3. Chronological Start Times: Schedule sessions starting tomorrow (${tomorrow.toDateString()}) at 09:00:00. On any given day, each subsequent task must begin immediately after the preceding task ends without overlapping.
4. Exam Priority: Prioritize topics that belong to subjects whose exams are coming up the soonest. Topics for earlier exams must be scheduled earlier in the timeline.
5. Topic Mapping: Each session must reference a valid "topicId" strictly from the provided incomplete topics list.
6. Return Format: Return a strictly valid JSON array conforming to the specified schema.`;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            systemInstruction: `You are an expert academic study planner.
You MUST NOT schedule more than ${dailyCapacity} hours of tasks on a single date. If the required hours exceed the daily limit, you MUST increment the date to the next day.
Never create duplicate tasks. If a topic requires multiple study sessions, name them sequentially (e.g., Part 1, Part 2). Ensure start times are sequential on the same day and do not overlap.`,
            responseFormat: {
              type: "text",
              mime_type: "application/json",
              schema: studyScheduleSchema,
            },
          } as any,
        });

        const rawText = response.text || "";
        const parsedArray = extractJsonArray(rawText);

        const validated = studyScheduleSchema.safeParse(parsedArray);
        const validSessions = validated.success ? validated.data : parsedArray;

        if (!Array.isArray(validSessions) || validSessions.length === 0) {
          throw new Error("Gemini returned an empty study session list.");
        }

        const validTopicIds = new Set(incompleteTopics.map((t) => t.id));
        const defaultTopicId = incompleteTopics[0].id;

        // Map and validate raw sessions from Gemini
        const mappedSessions = validSessions.map((s: any) => {
          const matchedTopicId = validTopicIds.has(s.topicId) ? s.topicId : defaultTopicId;
          const duration = parseFloat(s.durationHours?.toString() || "1.5");
          const durationHours = isNaN(duration) || duration <= 0 ? 1.5 : duration;

          return {
            topicId: matchedTopicId,
            title: s.title || `Study session for topic`,
            date: s.date,
            durationHours,
          };
        });

        // Enforce strict daily limit budgeting, anti-overlap timing, and sequential naming
        sessionsToCreate = normalizeAndEnforceDailyBudget(mappedSessions, dailyCapacity, tomorrow);
      } catch (geminiError: any) {
        console.error("Gemini 3.8 Flash generation error:", geminiError);

        if (body.allowFallback || geminiError?.status === 503 || geminiError?.message?.includes("503")) {
          console.warn("Falling back to intelligent capacity scheduler due to Gemini 503/fallback flag.");
          sessionsToCreate = generateAlgorithmicSchedule(incompleteTopics, upcomingExams, dailyCapacity, now);
          planSource = "smart-fallback";
        } else {
          return NextResponse.json(
            {
              success: false,
              error: `Gemini API Error: ${geminiError.message || "Failed to generate schedule"}`,
            },
            { status: 502 }
          );
        }
      }
    }

    if (sessionsToCreate.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No study sessions could be planned.",
        },
        { status: 500 }
      );
    }

    // 3. Create Task records in Prisma database for authenticated user's topics
    const createdTasks = await prisma.$transaction(
      sessionsToCreate.map((session) =>
        prisma.task.create({
          data: {
            title: session.title,
            date: new Date(session.date),
            durationHours: session.durationHours,
            isCompleted: false,
            topicId: session.topicId,
          },
          include: {
            topic: {
              include: {
                subject: true,
              },
            },
          },
        })
      )
    );

    return NextResponse.json(
      {
        success: true,
        count: createdTasks.length,
        tasks: createdTasks,
        source: planSource,
        message: `Successfully scheduled ${createdTasks.length} study sessions using ${planSource}.`,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Generate schedule route error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unexpected error occurred while generating study schedule",
      },
      { status: 500 }
    );
  }
}

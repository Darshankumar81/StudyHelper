"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import {
  signToken,
  setAuthCookie,
  clearAuthCookie,
  getSessionUser,
} from "@/lib/auth";

export async function registerUser(prevState: any, formData: FormData) {
  try {
    const name = formData.get("name")?.toString().trim();
    const email = formData.get("email")?.toString().trim().toLowerCase();
    const password = formData.get("password")?.toString();

    if (!name || !email || !password) {
      return { success: false, error: "All fields are required" };
    }

    if (password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters" };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false, error: "An account with this email already exists" };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        dailyStudyHours: 4,
      },
    });

    const token = await signToken({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
    });

    await setAuthCookie(token);
  } catch (error: any) {
    console.error("Registration failed:", error);
    return { success: false, error: "Failed to create account. Please try again." };
  }

  redirect("/");
}

export async function loginUser(prevState: any, formData: FormData) {
  try {
    const email = formData.get("email")?.toString().trim().toLowerCase();
    const password = formData.get("password")?.toString();

    if (!email || !password) {
      return { success: false, error: "Email and password are required" };
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, error: "Invalid email or password" };
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return { success: false, error: "Invalid email or password" };
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    await setAuthCookie(token);
  } catch (error: any) {
    console.error("Login failed:", error);
    return { success: false, error: "Authentication failed. Please try again." };
  }

  redirect("/");
}

export async function logoutUser() {
  await clearAuthCookie();
  redirect("/login");
}

export async function updateUserSettings(formData: FormData) {
  try {
    const user = await getSessionUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const dailyHours = parseInt(formData.get("dailyStudyHours")?.toString() || "4", 10);
    const name = formData.get("name")?.toString().trim();

    if (isNaN(dailyHours) || dailyHours < 1 || dailyHours > 24) {
      return { success: false, error: "Daily study hours must be between 1 and 24" };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        dailyStudyHours: dailyHours,
        ...(name ? { name } : {}),
      },
    });

    revalidatePath("/");
    revalidatePath("/subjects");
    revalidatePath("/schedule");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update settings:", error);
    return { success: false, error: "Failed to update study settings" };
  }
}

export async function createSubject(formData: FormData) {
  try {
    const user = await getSessionUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const name = formData.get("name")?.toString().trim();
    const totalHoursNeeded = parseFloat(formData.get("totalHoursNeeded")?.toString() || "0");

    if (!name) return { success: false, error: "Subject name is required" };

    await prisma.subject.create({
      data: {
        name,
        totalHoursNeeded: isNaN(totalHoursNeeded) ? 0 : totalHoursNeeded,
        userId: user.id,
      },
    });

    revalidatePath("/subjects");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to create subject:", error);
    return { success: false, error: "Failed to create subject" };
  }
}

export async function deleteSubject(subjectId: string) {
  try {
    const user = await getSessionUser();
    if (!user) return { success: false, error: "Unauthorized" };

    // Verify ownership
    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, userId: user.id },
    });

    if (!subject) return { success: false, error: "Subject not found or unauthorized" };

    await prisma.subject.delete({
      where: { id: subjectId },
    });

    revalidatePath("/subjects");
    revalidatePath("/schedule");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete subject:", error);
    return { success: false, error: "Failed to delete subject" };
  }
}

export async function createTopic(formData: FormData) {
  try {
    const user = await getSessionUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const subjectId = formData.get("subjectId")?.toString();
    const title = formData.get("title")?.toString().trim();
    const isCompleted = formData.get("isCompleted") === "true";

    if (!subjectId || !title) {
      return { success: false, error: "Subject and Topic title are required" };
    }

    // Verify subject ownership
    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, userId: user.id },
    });

    if (!subject) return { success: false, error: "Subject not found or unauthorized" };

    await prisma.topic.create({
      data: {
        subjectId,
        title,
        isCompleted,
      },
    });

    revalidatePath("/subjects");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to create topic:", error);
    return { success: false, error: "Failed to create topic" };
  }
}

export async function toggleTopicCompletion(topicId: string, isCompleted: boolean) {
  try {
    const user = await getSessionUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const topic = await prisma.topic.findFirst({
      where: { id: topicId, subject: { userId: user.id } },
    });

    if (!topic) return { success: false, error: "Topic not found or unauthorized" };

    await prisma.topic.update({
      where: { id: topicId },
      data: { isCompleted },
    });

    revalidatePath("/subjects");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle topic:", error);
    return { success: false, error: "Failed to update topic" };
  }
}

export async function deleteTopic(topicId: string) {
  try {
    const user = await getSessionUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const topic = await prisma.topic.findFirst({
      where: { id: topicId, subject: { userId: user.id } },
    });

    if (!topic) return { success: false, error: "Topic not found or unauthorized" };

    await prisma.topic.delete({
      where: { id: topicId },
    });

    revalidatePath("/subjects");
    revalidatePath("/schedule");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete topic:", error);
    return { success: false, error: "Failed to delete topic" };
  }
}

export async function createExam(formData: FormData) {
  try {
    const user = await getSessionUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const subjectId = formData.get("subjectId")?.toString();
    const title = formData.get("title")?.toString().trim();
    const dateStr = formData.get("date")?.toString();

    if (!subjectId || !title || !dateStr) {
      return { success: false, error: "Subject, title, and exam date are required" };
    }

    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, userId: user.id },
    });

    if (!subject) return { success: false, error: "Subject not found or unauthorized" };

    await prisma.exam.create({
      data: {
        subjectId,
        title,
        date: new Date(dateStr),
      },
    });

    revalidatePath("/subjects");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to create exam:", error);
    return { success: false, error: "Failed to create exam" };
  }
}

export async function deleteExam(examId: string) {
  try {
    const user = await getSessionUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const exam = await prisma.exam.findFirst({
      where: { id: examId, subject: { userId: user.id } },
    });

    if (!exam) return { success: false, error: "Exam not found or unauthorized" };

    await prisma.exam.delete({
      where: { id: examId },
    });

    revalidatePath("/subjects");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete exam:", error);
    return { success: false, error: "Failed to delete exam" };
  }
}

export async function createTask(formData: FormData) {
  try {
    const user = await getSessionUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const topicId = formData.get("topicId")?.toString();
    const title = formData.get("title")?.toString().trim();
    const dateStr = formData.get("date")?.toString();
    const durationHours = parseFloat(formData.get("durationHours")?.toString() || "1");

    if (!topicId || !title || !dateStr) {
      return { success: false, error: "Topic, task title, and date are required" };
    }

    const topic = await prisma.topic.findFirst({
      where: { id: topicId, subject: { userId: user.id } },
    });

    if (!topic) return { success: false, error: "Topic not found or unauthorized" };

    await prisma.task.create({
      data: {
        topicId,
        title,
        date: new Date(dateStr),
        durationHours: isNaN(durationHours) ? 1 : durationHours,
        isCompleted: false,
      },
    });

    revalidatePath("/schedule");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to create task:", error);
    return { success: false, error: "Failed to create task" };
  }
}

export async function toggleTaskCompletion(taskId: string, isCompleted: boolean) {
  try {
    const user = await getSessionUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const task = await prisma.task.findFirst({
      where: { id: taskId, topic: { subject: { userId: user.id } } },
    });

    if (!task) return { success: false, error: "Task not found or unauthorized" };

    await prisma.task.update({
      where: { id: taskId },
      data: { isCompleted },
    });

    revalidatePath("/schedule");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle task completion:", error);
    return { success: false, error: "Failed to update task" };
  }
}

export async function deleteTask(taskId: string) {
  try {
    const user = await getSessionUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const task = await prisma.task.findFirst({
      where: { id: taskId, topic: { subject: { userId: user.id } } },
    });

    if (!task) return { success: false, error: "Task not found or unauthorized" };

    await prisma.task.delete({
      where: { id: taskId },
    });

    revalidatePath("/schedule");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete task:", error);
    return { success: false, error: "Failed to delete task" };
  }
}

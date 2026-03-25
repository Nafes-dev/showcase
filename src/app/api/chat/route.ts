import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";
import { buildFullSystemPrompt } from "@/lib/template-prompts";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, projectId, history, templateId } = await req.json();
    const userId = (session.user as any).id;

    // Save user message
    await prisma.message.create({
      data: {
        role: "user",
        content: message,
        userId,
        projectId: projectId || null,
      },
    });

    // Build message history for OpenAI
    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: buildFullSystemPrompt(templateId) },
      ...(history || []).map((msg: any) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user", content: message },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 16000,
      messages,
    });

    const assistantMessage = response.choices[0]?.message?.content || "";

    // Save assistant message
    await prisma.message.create({
      data: {
        role: "assistant",
        content: assistantMessage,
        userId,
        projectId: projectId || null,
      },
    });

    // Extract HTML code if present
    const htmlMatch = assistantMessage.match(/```html\n([\s\S]*?)```/);
    const generatedCode = htmlMatch ? htmlMatch[1] : null;

    return NextResponse.json({
      message: assistantMessage,
      generatedCode,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}

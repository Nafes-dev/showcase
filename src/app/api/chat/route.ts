import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const TEMPLATE_INFO: Record<string, string> = {
  apex: `Apex SaaS — A premium SaaS landing page with:
- Dark background (#0a0a0f) with liquid glass effects (glassmorphism with blur)
- HLS video background in the hero section
- Geist Sans font, CSS variable color system (HSL)
- Sections: Hero with navbar + video, Features grid, Chess layout (alternating image/text), Stats/numbers, Testimonials, CTA Footer
- Gradient buttons, backdrop-blur panels, purple/blue accent colors
- Live reference: https://apex-saas-seven.vercel.app/`,

  "ai-builder": `AI Builder — A minimal hero-focused landing page with:
- Dark theme with motion/framer-motion animations
- Bold typography, minimal sections (just Navbar + Hero)
- Clean, modern aesthetic with animated elements
- Lightweight and focused design
- Live reference: https://ai-builder-zeta-three.vercel.app/`,

  velorah: `Velorah — An elegant, serif-based hero page with:
- Display serif font for headings
- Video background via CloudFront CDN
- Liquid glass buttons with blur effects
- Minimalist, focus-driven design philosophy
- "Begin Journey" style CTAs
- Navigation links in a clean top bar
- Live reference: https://velorah-blush.vercel.app/`,

  studio: `Studio Agency — An AI-powered web design agency page with:
- Heavy use of Motion (framer-motion) animations
- BlurText animated components in the hero
- Instrument Serif for headings, Barlow for body text
- Liquid glass UI (stronger blur than other templates)
- HLS video streaming background
- Sections: Navbar, Hero with blur animations, Partners carousel, Start section, Features chess layout, Features grid, Stats, Testimonials, CTA Footer
- Orange/rose accent gradients
- Live reference: https://studio-agency-theta.vercel.app/`,
};

const SYSTEM_PROMPT = `You are an AI website builder assistant for MotionSites. You help users create beautiful, modern web pages based on our premium templates.

We have 4 premium templates that users can select as a starting point:
1. Apex SaaS — Premium SaaS landing page with liquid glass aesthetic
2. AI Builder — Minimal hero-focused page with motion animations
3. Velorah — Elegant, serif-based hero with video background
4. Studio Agency — Full agency page with blur text animations

When a user selects a template, you will receive detailed information about that template's design system, sections, and style. Use this as the foundation and customize it based on the user's requests.

Guidelines:
- Generate complete, self-contained HTML pages with Tailwind CSS (via CDN: <script src="https://cdn.tailwindcss.com"></script>)
- Match the dark aesthetic of our templates (#0a0a0f backgrounds, glassmorphism, blur effects)
- Use beautiful gradients, glassmorphism effects, and modern design patterns
- Include all styles inline or via Tailwind classes
- Make pages fully responsive
- Use placeholder images from picsum.photos when needed
- Include smooth animations and hover effects via CSS
- The generated code must be a complete, standalone HTML file that works on its own

When generating code, wrap it in \`\`\`html code blocks.

When the user asks to modify something (change colors, text, images, sections), regenerate the full page with changes applied.

Help users customize: company name, colors, text content, images, section order, adding/removing sections, changing layouts, fonts, and animations.`;

function buildSystemPrompt(templateId?: string): string {
  if (!templateId || !TEMPLATE_INFO[templateId]) return SYSTEM_PROMPT;
  return `${SYSTEM_PROMPT}\n\nThe user has selected the following template as their starting point:\n\n${TEMPLATE_INFO[templateId]}\n\nUse this template's design language, color scheme, and section structure as the foundation. Recreate a similar page and customize it based on the user's instructions.`;
}

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
      { role: "system", content: buildSystemPrompt(templateId) },
      ...(history || []).map((msg: any) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user", content: message },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 8000,
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

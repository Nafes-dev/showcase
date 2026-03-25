"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  Send,
  Bot,
  User,
  Eye,
  Save,
  Rocket,
  Plus,
  X,
  ExternalLink,
  Loader2,
  Sparkles,
} from "lucide-react";
import { templates } from "@/lib/templates";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  generatedCode: string;
  deployed: boolean;
  vercelUrl: string | null;
  createdAt: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [saving, setSaving] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchProjects();
    }
  }, [session]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchProjects = async () => {
    const res = await fetch("/api/projects");
    if (res.ok) {
      const data = await res.json();
      setProjects(data);
    }
  };

  const selectTemplate = (templateId: string) => {
    const tmpl = templates.find((t) => t.id === templateId);
    if (!tmpl) return;
    setSelectedTemplate(templateId);
    const msg = `I want to create a website based on the "${tmpl.title}" template (${tmpl.description}). Reference: ${tmpl.url}`;
    setInput(msg);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          projectId: currentProjectId,
          history: messages,
          templateId: selectedTemplate,
        }),
      });

      const data = await res.json();

      if (data.message) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.message },
        ]);
      }

      if (data.generatedCode) {
        setGeneratedCode(data.generatedCode);
        setShowPreview(true);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
    }

    setLoading(false);
  };

  const saveProject = async () => {
    if (!projectName.trim() || !generatedCode) return;
    setSaving(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName,
          template: selectedTemplate,
          generatedCode,
        }),
      });

      if (res.ok) {
        const project = await res.json();
        setCurrentProjectId(project.id);
        setShowSaveModal(false);
        setProjectName("");
        fetchProjects();
      }
    } catch {
      alert("Failed to save project");
    }

    setSaving(false);
  };

  const deployProject = async (projectId: string) => {
    setDeploying(true);

    try {
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(`Deployed successfully!\n\nURL: ${data.url}`);
        fetchProjects();
      } else {
        alert(`Deploy failed: ${data.error}`);
      }
    } catch {
      alert("Failed to deploy");
    }

    setDeploying(false);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-16">
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar - Projects */}
        <div className="w-72 border-r border-white/10 bg-white/[0.02] flex flex-col">
          <div className="p-4 border-b border-white/10">
            <button
              onClick={() => {
                setMessages([]);
                setGeneratedCode(null);
                setShowPreview(false);
                setCurrentProjectId(null);
                setSelectedTemplate(null);
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" /> New Project
            </button>
          </div>

          {/* My Projects */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {projects.length > 0 && (
              <p className="text-[10px] uppercase tracking-wider text-white/30 px-1 mb-2">
                My Projects
              </p>
            )}
            {projects.map((project) => (
              <div
                key={project.id}
                className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-white font-medium truncate">
                    {project.name}
                  </span>
                  {project.deployed && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                      Live
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {project.vercelUrl ? (
                    <a
                      href={project.vercelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> View
                    </a>
                  ) : (
                    <button
                      onClick={() => deployProject(project.id)}
                      disabled={deploying}
                      className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1"
                    >
                      <Rocket className="w-3 h-3" /> Deploy
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Chat Area */}
          <div className={`flex flex-col ${showPreview ? "w-1/2" : "flex-1"}`}>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Bot className="w-16 h-16 text-purple-400/30 mb-4" />
                  <h2 className="text-xl font-semibold text-white mb-2">
                    AI Website Builder
                  </h2>
                  <p className="text-white/40 max-w-md mb-8">
                    Pick a template below as your starting point, or describe a
                    website from scratch.
                  </p>

                  {/* Template Selection Cards */}
                  <div className="grid grid-cols-2 gap-3 w-full max-w-lg mb-8">
                    {templates.map((tmpl) => (
                      <button
                        key={tmpl.id}
                        onClick={() => selectTemplate(tmpl.id)}
                        className={`relative p-3 rounded-xl border text-left transition-all ${
                          selectedTemplate === tmpl.id
                            ? "border-purple-500 bg-purple-500/10"
                            : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                        }`}
                      >
                        {/* Mini preview */}
                        <div
                          className={`aspect-[16/9] rounded-lg bg-gradient-to-br ${tmpl.gradient} overflow-hidden mb-2 relative`}
                        >
                          <iframe
                            src={tmpl.url}
                            title={tmpl.title}
                            className="w-[1440px] h-[900px] origin-top-left pointer-events-none border-0"
                            style={{
                              transform: "scale(0.12)",
                              transformOrigin: "top left",
                            }}
                            loading="lazy"
                            sandbox="allow-scripts allow-same-origin"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-white">
                              {tmpl.title}
                            </p>
                            <p className="text-[11px] text-white/40">
                              {tmpl.category}
                            </p>
                          </div>
                          {tmpl.tag && (
                            <span className="flex items-center gap-1 text-[10px] text-purple-400">
                              <Sparkles className="w-2.5 h-2.5" />
                              {tmpl.tag}
                            </span>
                          )}
                        </div>
                        <a
                          href={tmpl.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] text-white/30 hover:text-purple-400 flex items-center gap-1 mt-1"
                        >
                          <ExternalLink className="w-2.5 h-2.5" /> Preview live
                        </a>
                      </button>
                    ))}
                  </div>

                  {/* Quick prompts */}
                  <p className="text-xs text-white/30 mb-3">
                    Or start from scratch:
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {[
                      "Create a SaaS landing page",
                      "Build a portfolio site",
                      "Make a product showcase",
                      "Design a blog layout",
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setInput(suggestion)}
                        className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-white/60 hover:text-white hover:border-purple-500/30 transition-all"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-purple-400" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                      msg.role === "user"
                        ? "bg-purple-500/20 text-white"
                        : "bg-white/5 text-white/80"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">
                      {msg.content.replace(
                        /```html[\s\S]*?```/g,
                        "[Generated Code - See Preview →]"
                      )}
                    </p>
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white/60" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="bg-white/5 rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0.1s]" />
                      <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0.2s]" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Selected template indicator */}
            {selectedTemplate && (
              <div className="mx-4 mb-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
                <span className="text-xs text-purple-300">
                  Using template:{" "}
                  <strong>
                    {templates.find((t) => t.id === selectedTemplate)?.title}
                  </strong>
                </span>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="text-purple-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-white/10">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !e.shiftKey && sendMessage()
                  }
                  placeholder={
                    selectedTemplate
                      ? `Customize the ${templates.find((t) => t.id === selectedTemplate)?.title} template...`
                      : "Describe the website you want to build..."
                  }
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 transition-colors"
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          {showPreview && generatedCode && (
            <div className="w-1/2 border-l border-white/10 flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <Eye className="w-4 h-4" />
                  Live Preview
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSaveModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70 hover:text-white transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" /> Save
                  </button>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1 bg-white">
                <iframe
                  srcDoc={generatedCode}
                  className="w-full h-full border-0"
                  title="Preview"
                  sandbox="allow-scripts"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#12121a] border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">
              Save Project
            </h3>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Project name"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveProject}
                disabled={saving || !projectName.trim()}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save & Continue"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

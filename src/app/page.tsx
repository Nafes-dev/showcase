"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { ExternalLink, Copy, Sparkles, ArrowRight } from "lucide-react";
import { templates, Template } from "@/lib/templates";

function ProjectCard({ project }: { project: Template }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(project.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <a
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
    >
      <div className="rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-300">
        {/* Thumbnail area */}
        <div
          className={`relative aspect-[16/10] bg-gradient-to-br ${project.gradient} overflow-hidden`}
        >
          {/* Live iframe preview */}
          <div className="absolute inset-0 overflow-hidden">
            <iframe
              src={project.url}
              title={project.title}
              className="w-[1440px] h-[900px] origin-top-left pointer-events-none border-0"
              style={{ transform: "scale(0.25)", transformOrigin: "top left" }}
              loading="lazy"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2 bg-white text-black rounded-full px-5 py-2.5 text-sm font-medium">
              <ExternalLink className="w-4 h-4" />
              View Site
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="px-4 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">
              {project.title}
            </h3>
            <p className="text-xs text-white/40 mt-0.5">{project.category}</p>
          </div>
          <div className="flex items-center gap-2">
            {project.tag && (
              <span className="flex items-center gap-1 text-xs text-white/50 border border-white/10 rounded-full px-2.5 py-1">
                <Sparkles className="w-3 h-3" />
                {project.tag}
              </span>
            )}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-white/50 hover:text-white border border-white/10 hover:border-white/20 rounded-full px-2.5 py-1 transition-colors"
            >
              <Copy className="w-3 h-3" />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </a>
  );
}

export default function Home() {
  const { data: session } = useSession();
  const [activeFilter, setActiveFilter] = useState("All");

  const filters = ["All", "SaaS", "Agency", "Hero Section", "Landing Page"];
  const filteredProjects =
    activeFilter === "All"
      ? templates
      : templates.filter((p) => p.category === activeFilter);

  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-16">
      {/* Hero */}
      <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-12 text-center">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px]" />
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-[128px]" />

        <div className="relative">
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
            Premium Templates
          </h1>
          <p className="text-white/40 text-base mt-4 max-w-lg mx-auto">
            Hand-crafted, production-ready landing pages. Click to preview, or
            use them as a base to build your own with AI.
          </p>

          {/* CTA */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <Link
              href={session ? "/dashboard" : "/signup"}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              {session ? "Open AI Builder" : "Start Building with AI"}{" "}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Filter pills */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  activeFilter === filter
                    ? "bg-white text-black font-medium"
                    : "text-white/50 hover:text-white hover:bg-white/5 border border-white/[0.06]"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.title} project={project} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-white/30">
            &copy; 2026 MotionSites. All rights reserved.
          </span>
          <div className="flex gap-6">
            {["Privacy", "Terms", "Contact"].map((link) => (
              <a
                key={link}
                href="#"
                className="text-xs text-white/30 hover:text-white/60 transition-colors"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

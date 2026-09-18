"use client";

import { ArrowLeft, BookOpen, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EXTERNAL_PRACTICE, GUIDE_SECTIONS } from "@/data/guide";

export function GuideScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="mx-auto w-full max-w-md px-4 pb-16 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="mb-5 flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 rounded-full"
          onClick={onBack}
        >
          <ArrowLeft className="size-4" />
          Setup
        </Button>
      </div>

      <header className="mb-6">
        <p className="mb-2 font-mono text-[11px] tracking-[0.28em] text-copper uppercase">
          Official docs
        </p>
        <h1 className="font-heading text-3xl tracking-tight text-ink sm:text-4xl">
          Docs guide
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
          Same domains as the quiz. Each link is a public page that was checked
          to load. Read the page, then filter the quiz to that domain.
        </p>
      </header>

      <Card className="mb-4 border-copper/20 bg-card/95 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <BookOpen className="size-4 text-copper" />
            How to drill with the docs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pb-4 text-sm text-muted-foreground">
          <p>
            On setup, select one domain (or a tag). Empty means the whole bank.
            Instant reveals the explanation after each answer. Exam hides it
            until the results screen.
          </p>
          <p>
            When an explanation names a doc idea (hooks, permissions, Glob,
            sessions), open the matching section below. The quiz does not store
            a read-progress for this page.
          </p>
        </CardContent>
      </Card>


      <section className="mb-4">
        <h2 className="mb-2 text-sm font-semibold">More practice</h2>
        <div className="grid gap-2">
          {EXTERNAL_PRACTICE.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="block min-h-14 rounded-2xl border border-border bg-card px-3 py-3"
            >
              <span className="flex items-center justify-between gap-2 text-sm font-semibold">
                {link.title}
                <ExternalLink className="size-3.5 shrink-0 text-copper" />
              </span>
              <span className="mt-1 block text-sm text-muted-foreground">
                {link.what}
              </span>
            </a>
          ))}
        </div>
      </section>

      <div className="grid gap-3.5">
        {GUIDE_SECTIONS.map((section) => (
          <Card key={section.domain} className="bg-card/95 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base sm:text-lg">
                {section.domain}
              </CardTitle>
              <CardDescription>{section.blurb}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pb-4">
              {section.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-xl border border-border/80 bg-background/70 p-3 transition-colors hover:border-copper/40 hover:bg-accent"
                >
                  <span className="flex items-center justify-between gap-2 font-medium text-foreground">
                    {link.title}
                    <ExternalLink className="size-3.5 shrink-0 text-copper" />
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {link.what}
                  </span>
                  <span className="mt-2 block truncate font-mono text-[11px] text-copper">
                    {link.href.replace("https://", "")}
                  </span>
                </a>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

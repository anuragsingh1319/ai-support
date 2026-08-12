"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckIcon, CopyIcon } from "lucide-react";

// Simulated agents list
const agents = [
  { id: "agent-abc-123", name: "Support Bot" },
  { id: "agent-def-456", name: "Sales Assistant" },
];

export default function DeployPage() {
  const [selectedAgent, setSelectedAgent] = useState(agents[0].id);
  const [copied, setCopied] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.yourdomain.com/api/v1";
  const widgetUrl = process.env.NEXT_PUBLIC_WIDGET_URL || "https://cdn.yourdomain.com/widget.js";

  const embedCode = `<!-- AI Support Widget -->
<script
  src="${widgetUrl}"
  data-agent-id="${selectedAgent}"
  async>
</script>`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Deploy Chat Widget</h1>
        <Badge variant="outline" className="text-green-500 border-green-500">
          ● Live
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Embed on Your Website</CardTitle>
            <CardDescription>
              Paste this snippet before the{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">{`</body>`}</code>{" "}
              tag of your website.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Select Agent</label>
              <Select value={selectedAgent} onValueChange={(v) => v && setSelectedAgent(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <pre className="rounded-lg border border-border bg-muted/40 p-4 text-sm font-mono overflow-x-auto text-muted-foreground leading-relaxed">
                {embedCode}
              </pre>
              <button
                onClick={handleCopy}
                className="absolute top-3 right-3 p-1.5 rounded-md bg-background border border-border hover:bg-muted transition-colors"
                aria-label="Copy snippet"
              >
                {copied ? (
                  <CheckIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <CopyIcon className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Live preview */}
        <Card>
          <CardHeader>
            <CardTitle>Widget Preview</CardTitle>
            <CardDescription>
              This is a static preview of how the widget will look on your
              visitors&apos; screens.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative h-80 rounded-xl border border-border bg-muted/30 overflow-hidden">
              {/* Simulated website background */}
              <div className="p-6 text-muted-foreground text-sm">
                Your website content here…
              </div>

              {/* Widget preview (static) */}
              <div className="absolute bottom-4 right-4 flex flex-col items-end gap-3">
                {/* Mini chat window */}
                <div className="w-64 h-48 bg-[#0f0f1a] rounded-xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-500 to-violet-500 px-3 py-2 flex items-center gap-2">
                    <span className="text-lg">🤖</span>
                    <div>
                      <p className="text-white text-xs font-semibold leading-none">AI Support</p>
                      <p className="text-white/70 text-[10px]">Online · Replies instantly</p>
                    </div>
                  </div>
                  <div className="flex-1 p-3 flex flex-col gap-2 justify-end">
                    <div className="text-[11px] text-white/80 bg-white/5 rounded-lg px-2.5 py-1.5 self-start max-w-[90%] border border-white/8">
                      Hi! How can I help you today? 👋
                    </div>
                    <div className="text-[11px] text-white rounded-lg px-2.5 py-1.5 self-end max-w-[90%] bg-gradient-to-r from-indigo-500 to-violet-500">
                      How do I return an order?
                    </div>
                  </div>
                  <div className="px-2 py-1.5 border-t border-white/5 flex gap-1.5">
                    <div className="flex-1 bg-white/5 rounded-lg px-2 py-1 text-[11px] text-white/30">
                      Type a message…
                    </div>
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs flex-shrink-0">
                      ↑
                    </div>
                  </div>
                </div>

                {/* Launcher bubble */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-violet-500/40 flex items-center justify-center text-2xl cursor-pointer">
                  💬
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm text-muted-foreground">
            {[
              "Select the AI agent you want to deploy from the dropdown above.",
              "Copy the embed code snippet.",
              "Paste the snippet before the </body> closing tag in your website's HTML.",
              "Optionally set window.AI_SUPPORT_API_URL to point to your self-hosted API.",
              "Save and deploy your website — the chat bubble will appear automatically.",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-semibold">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

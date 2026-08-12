import Link from "next/link"
import { ReactNode } from "react"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-lg font-semibold md:text-base"
          >
            <span className="sr-only">AI Support Platform</span>
            AI Support
          </Link>
          <Link
            href="/dashboard"
            className="text-foreground transition-colors hover:text-foreground"
          >
            Overview
          </Link>
          <Link
            href="/conversations"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Conversations
          </Link>
          <Link
            href="/dashboard/agents"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Agents
          </Link>
          <Link
            href="/knowledge-base"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Knowledge Base
          </Link>
          <Link
            href="/tools"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Tools
          </Link>
          <Link
            href="/deploy"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Deploy Widget
          </Link>
          <Link
            href="/dashboard/settings"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Settings
          </Link>
        </nav>
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <div className="ml-auto flex items-center gap-4">
            <span className="text-sm text-muted-foreground">User Org</span>
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
    </div>
  )
}

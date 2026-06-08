import Link from "next/link";
import { Sparkles } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Sparkles className="size-5 text-primary" />
          <span>ferfecday</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            홈
          </Link>
          <Link href="#" className="hover:text-foreground">
            서비스 소개
          </Link>
        </nav>
      </div>
    </header>
  );
}

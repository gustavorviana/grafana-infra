"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { logout } from "@/app/actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/users", label: "Usuários" },
  { href: "/applications", label: "Aplicações" },
  { href: "/tokens", label: "Tokens de Log" },
  { href: "/blocked-ips", label: "IPs Bloqueados" },
  { href: "/docs", label: "Documentação" },
];

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logout();
      router.replace("/");
      router.refresh();
    });
  }

  return (
    <nav className="flex items-center gap-1 border-b bg-background px-4 py-3">
      <span className="mr-4 font-semibold">Logs App</span>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            pathname === l.href
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          {l.label}
        </Link>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="ml-auto"
        disabled={pending}
        onClick={handleLogout}
      >
        <LogOut /> Sair
      </Button>
    </nav>
  );
}

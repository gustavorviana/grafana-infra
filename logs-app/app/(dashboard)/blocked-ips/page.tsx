"use client";

import * as React from "react";
import { ShieldOff, Unlock } from "lucide-react";

import { listBlockedIps, unblockIp } from "@/app/actions";
import type { LoginAttempt } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function BlockedIpsPage() {
  const [blocked, setBlocked] = React.useState<LoginAttempt[]>([]);
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => {
    listBlockedIps().then(setBlocked);
  }, []);

  function handleUnblock(ip: string) {
    startTransition(async () => setBlocked(await unblockIp(ip)));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">IPs Bloqueados</h1>
        <p className="text-muted-foreground text-sm">
          IPs bloqueados após {10} tentativas de login inválidas.
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>IP</TableHead>
            <TableHead>Tentativas</TableHead>
            <TableHead>Expira em</TableHead>
            <TableHead className="w-32 text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {blocked.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-muted-foreground text-center"
              >
                Nenhum IP bloqueado.
              </TableCell>
            </TableRow>
          ) : (
            blocked.map((b) => (
              <TableRow key={b.ip}>
                <TableCell className="font-mono">
                  <span className="flex items-center gap-2">
                    <ShieldOff className="text-destructive size-4" />
                    {b.ip}
                  </span>
                </TableCell>
                <TableCell>{b.attempts}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {b.blockedAt
                    ? new Date(b.blockedAt + 24 * 60 * 60 * 1000).toLocaleString("pt-BR")
                    : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() => handleUnblock(b.ip)}
                  >
                    <Unlock className="size-3" /> Desbloquear
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

"use client";

import * as React from "react";
import {
  Copy,
  Eye,
  KeyRound,
  Pencil,
  Plus,
  RotateCw,
  Trash2,
} from "lucide-react";

import {
  createToken,
  deleteToken,
  listApplications,
  listTokens,
  resetToken,
  updateToken,
} from "@/app/actions";
import type { Application, LogToken } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function mask(token: string) {
  return token.slice(0, 8) + "…" + token.slice(-4);
}

export default function TokensPage() {
  const [apps, setApps] = React.useState<Application[]>([]);
  const [tokens, setTokens] = React.useState<LogToken[]>([]);
  const [pending, startTransition] = React.useTransition();

  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<LogToken | null>(null);
  const [description, setDescription] = React.useState("");
  const [applicationId, setApplicationId] = React.useState("");

  // shows the full token value (after create / reset / view)
  const [revealed, setRevealed] = React.useState<string | null>(null);

  React.useEffect(() => {
    listApplications().then(setApps);
    listTokens().then(setTokens);
  }, []);

  const appName = (id: string) => apps.find((a) => a.id === id)?.name ?? "—";

  function openCreate() {
    setEditing(null);
    setDescription("");
    setApplicationId(apps[0]?.id ?? "");
    setOpen(true);
  }

  function openEdit(t: LogToken) {
    setEditing(t);
    setDescription(t.description);
    setApplicationId(t.applicationId);
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!applicationId) return;
    startTransition(async () => {
      if (editing) {
        setTokens(await updateToken(editing.id, { description, applicationId }));
        setOpen(false);
      } else {
        const { created, tokens: next } = await createToken({
          description,
          applicationId,
        });
        setTokens(next);
        setOpen(false);
        setRevealed(created.token);
      }
    });
  }

  function handleReset(id: string) {
    startTransition(async () => {
      const { token, tokens: next } = await resetToken(id);
      setTokens(next);
      setRevealed(token);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => setTokens(await deleteToken(id)));
  }

  function copy(value: string) {
    void navigator.clipboard.writeText(value);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tokens de Log</h1>
          <p className="text-muted-foreground text-sm">
            O token é gerado apenas na criação. Use “Redefinir” para gerar um
            novo.
          </p>
        </div>
        <Button onClick={openCreate} disabled={apps.length === 0}>
          <Plus /> Novo token
        </Button>
      </div>

      {apps.length === 0 && (
        <p className="text-muted-foreground rounded-md border border-dashed p-4 text-sm">
          Cadastre uma aplicação antes de criar tokens.
        </p>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Aplicação</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Token</TableHead>
            <TableHead className="w-44 text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tokens.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-muted-foreground text-center"
              >
                Nenhum token cadastrado.
              </TableCell>
            </TableRow>
          ) : (
            tokens.map((t) => (
              <TableRow key={t.id}>
                <TableCell title={appName(t.applicationId)}>{appName(t.applicationId)}</TableCell>
                <TableCell className="font-medium" title={t.description}>{t.description}</TableCell>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => copy(t.token)}
                    className="text-muted-foreground hover:text-foreground flex items-center gap-1 font-mono text-xs"
                    title="Copiar token"
                  >
                    {mask(t.token)}
                    <Copy className="size-3" />
                  </button>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Visualizar token"
                      onClick={() => setRevealed(t.token)}
                    >
                      <Eye />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Redefinir token"
                      disabled={pending}
                      onClick={() => handleReset(t.id)}
                    >
                      <RotateCw />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Editar"
                      onClick={() => openEdit(t)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Remover"
                      disabled={pending}
                      onClick={() => handleDelete(t.id)}
                    >
                      <Trash2 className="text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Create / Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Editar token" : "Novo token"}
              </DialogTitle>
              <DialogDescription>
                {editing
                  ? "Edite a descrição e a aplicação. O token não muda aqui — use “Redefinir”."
                  : "O token será gerado ao salvar. Você pode visualizá-lo depois."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="application">Aplicação</Label>
              <Select value={applicationId} onValueChange={setApplicationId}>
                <SelectTrigger id="application">
                  <SelectValue placeholder="Selecione a aplicação" />
                </SelectTrigger>
                <SelectContent>
                  {apps.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reveal token dialog (create / reset / view) */}
      <Dialog
        open={revealed !== null}
        onOpenChange={(o) => !o && setRevealed(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="size-4" /> Token
            </DialogTitle>
            <DialogDescription>Copie o token abaixo.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={revealed ?? ""}
              className="font-mono text-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => revealed && copy(revealed)}
            >
              <Copy />
            </Button>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setRevealed(null)}>
              Concluído
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

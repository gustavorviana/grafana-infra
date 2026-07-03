"use client";

import * as React from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import {
  createApplication,
  deleteApplication,
  listApplications,
  updateApplication,
} from "@/app/actions";
import type { Application } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ApplicationsPage() {
  const [apps, setApps] = React.useState<Application[]>([]);
  const [pending, startTransition] = React.useTransition();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Application | null>(null);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [tag, setTag] = React.useState("");

  React.useEffect(() => {
    listApplications().then(setApps);
  }, []);

  function openCreate() {
    setEditing(null);
    setName("");
    setDescription("");
    setTag("");
    setOpen(true);
  }

  function openEdit(a: Application) {
    setEditing(a);
    setName(a.name);
    setDescription(a.description);
    setTag(a.tag);
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const next = editing
        ? await updateApplication(editing.id, { name, description, tag })
        : await createApplication({ name, description, tag });
      setApps(next);
      setOpen(false);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => setApps(await deleteApplication(id)));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Aplicações</h1>
          <p className="text-muted-foreground text-sm">
            Cadastro de aplicações (nome, descrição e tag de log).
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus /> Nova aplicação
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Tag</TableHead>
            <TableHead className="w-24 text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {apps.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-muted-foreground text-center"
              >
                Nenhuma aplicação cadastrada.
              </TableCell>
            </TableRow>
          ) : (
            apps.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.name}</TableCell>
                <TableCell className="text-muted-foreground max-w-xs truncate">
                  {a.description}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-mono">
                    {a.tag}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(a)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={pending}
                      onClick={() => handleDelete(a.id)}
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Editar aplicação" : "Nova aplicação"}
              </DialogTitle>
              <DialogDescription>
                Defina nome, descrição e a tag usada nos logs.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tag">Tag</Label>
              <Input
                id="tag"
                className="font-mono"
                placeholder="minha-app"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

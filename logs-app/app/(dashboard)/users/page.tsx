"use client";

import * as React from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { createUser, deleteUser, listUsers, updateUser } from "@/app/actions";
import type { PublicUser } from "@/lib/types";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function UsersPage() {
  const [users, setUsers] = React.useState<PublicUser[]>([]);
  const [pending, startTransition] = React.useTransition();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<PublicUser | null>(null);
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    listUsers().then(setUsers);
  }, []);

  function openCreate() {
    setEditing(null);
    setUsername("");
    setPassword("");
    setError(null);
    setOpen(true);
  }

  function openEdit(u: PublicUser) {
    setEditing(u);
    setUsername(u.username);
    // Password is not fetched; leave blank and only change it when filled.
    setPassword("");
    setError(null);
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = editing
        ? // On edit, only update the password when the field was filled in.
          await updateUser(
            editing.id,
            password ? { username, password } : { username }
          )
        : await createUser({ username, password });
      setUsers(result.users);
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => setUsers(await deleteUser(id)));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Usuários</h1>
          <p className="text-muted-foreground text-sm">
            Cadastro de usuários (usuário e senha).
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus /> Novo usuário
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuário</TableHead>
            <TableHead className="w-24 text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={2}
                className="text-muted-foreground text-center"
              >
                Nenhum usuário cadastrado.
              </TableCell>
            </TableRow>
          ) : (
            users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.username}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(u)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={pending}
                      onClick={() => handleDelete(u.id)}
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
                {editing ? "Editar usuário" : "Novo usuário"}
              </DialogTitle>
              <DialogDescription>
                {editing
                  ? "Deixe a senha em branco para mantê-la."
                  : "Defina usuário e senha de acesso."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder={editing ? "(inalterada)" : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!editing}
              />
              <p className="text-muted-foreground text-xs">
                Mínimo 8 caracteres. Evite senhas comuns.
              </p>
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
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

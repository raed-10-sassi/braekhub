import { useState } from "react";
import { useManageUsers } from "@/hooks/useManageUsers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Loader2, UserCog } from "lucide-react";

export default function UserManagement() {
  const { users, isLoading, createUser, updateUser, deleteUser } = useManageUsers();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Create form
  const [newUsername, setNewUsername] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("hall_owner");

  // Edit form
  const [editUsername, setEditUsername] = useState("");
  const [editFullName, setEditFullName] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState("");

  const handleCreate = async () => {
    await createUser.mutateAsync({
      username: newUsername,
      full_name: newFullName,
      email: newEmail,
      password: newPassword,
      role: newRole,
    });
    setCreateOpen(false);
    setNewUsername("");
    setNewFullName("");
    setNewEmail("");
    setNewPassword("");
    setNewRole("hall_owner");
  };

  const openEdit = (user: any) => {
    setEditingUser(user);
    setEditUsername(user.username || "");
    setEditFullName(user.full_name || "");
    setEditPassword("");
    setEditRole(user.role || "");
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingUser) return;
    const data: any = { user_id: editingUser.id };
    if (editUsername !== editingUser.username) data.username = editUsername;
    if (editFullName !== editingUser.full_name) data.full_name = editFullName;
    if (editPassword) data.password = editPassword;
    if (editRole !== editingUser.role) data.role = editRole;

    await updateUser.mutateAsync(data);
    setEditOpen(false);
    setEditingUser(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <UserCog className="h-8 w-8" />
            Gestion des Utilisateurs
          </h1>
          <p className="text-muted-foreground mt-1">Créer et gérer les comptes des employés</p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nouvel Utilisateur</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un Utilisateur</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nom d'utilisateur</Label>
                <Input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="johndoe" />
              </div>
              <div className="space-y-2">
                <Label>Nom complet</Label>
                <Input value={newFullName} onChange={(e) => setNewFullName(e.target.value)} placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} type="email" placeholder="john@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Mot de passe</Label>
                <Input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hall_owner">Hall Owner</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={createUser.isPending || !newUsername || !newEmail || !newPassword}>
                {createUser.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Créer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Utilisateurs</CardTitle>
          <CardDescription>Liste de tous les utilisateurs de l'application</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom d'utilisateur</TableHead>
                  <TableHead>Nom complet</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Aucun utilisateur trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username || "—"}</TableCell>
                      <TableCell>{user.full_name || "—"}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.role ? (
                          <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                            {user.role === "admin" ? "Admin" : "Hall Owner"}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer l'utilisateur ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Cette action est irréversible. Le compte de {user.full_name || user.username} sera définitivement supprimé.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteUser.mutate(user.id)}>
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'Utilisateur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom d'utilisateur</Label>
              <Input value={editUsername} onChange={(e) => setEditUsername(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Nom complet</Label>
              <Input value={editFullName} onChange={(e) => setEditFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Nouveau mot de passe (laisser vide pour ne pas changer)</Label>
              <Input value={editPassword} onChange={(e) => setEditPassword(e.target.value)} type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hall_owner">Hall Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdate} disabled={updateUser.isPending}>
              {updateUser.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

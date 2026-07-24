import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, Users, UserPlus, Loader2, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

const TIPOS_GESTOR = {
  geral: "Gestor Geral",
  pedagogico: "Gestor Pedagógico",
  administrativo: "Gestor Administrativo",
};

export default function UserManagement() {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviteGestor, setInviteGestor] = useState("nenhum");
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await User.list();
      setUsers(data);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
    }
    setIsLoading(false);
  };

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingId(userId);
    try {
      await User.update(userId, { role: newRole });
      await loadUsers();
    } catch (error) {
      console.error("Erro ao alterar função:", error);
    }
    setUpdatingId(null);
  };

  const handleGestorChange = async (userId, newTipo) => {
    setUpdatingId(userId);
    try {
      const data =
        newTipo === "nenhum"
          ? { tipo_gestor: undefined }
          : { tipo_gestor: newTipo };
      await User.update(userId, data);
      await loadUsers();
    } catch (error) {
      console.error("Erro ao alterar tipo de gestor:", error);
    }
    setUpdatingId(null);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    try {
      await base44.users.inviteUser(inviteEmail.trim(), inviteRole);
      if (inviteGestor !== "nenhum") {
        const updated = await User.list();
        const newUser = updated.find(
          (u) => u.email === inviteEmail.trim()
        );
        if (newUser) {
          await User.update(newUser.id, { tipo_gestor: inviteGestor });
        }
      }
      toast({
        title: "Convite enviado!",
        description: `${inviteEmail} receberá um email para se cadastrar.`,
      });
      setInviteOpen(false);
      setInviteEmail("");
      setInviteRole("user");
      setInviteGestor("nenhum");
      await loadUsers();
    } catch (error) {
      toast({
        title: "Erro ao convidar",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    }
    setIsInviting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-semibold text-slate-900">
                Gestão de Usuários
              </h3>
            </div>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => setInviteOpen(true)}
            >
              <UserPlus className="w-4 h-4 mr-1" />
              Cadastrar Gestor
            </Button>
          </div>
          <p className="text-sm text-slate-500 mb-6">
            Defina administradores e gestores que recebem relatórios mensais
          </p>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-8">
              Nenhum usuário encontrado
            </p>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 py-3 border-b border-slate-50 last:border-0"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="w-9 h-9 flex-shrink-0">
                      <AvatarFallback className="bg-emerald-600 text-white text-sm font-medium">
                        {user.full_name?.charAt(0) ||
                          user.email?.charAt(0) ||
                          "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {user.full_name || "Usuário"}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {user.role === "admin" && (
                      <Badge className="bg-emerald-50 text-emerald-700 border-0 font-medium">
                        <Shield className="w-3 h-3 mr-1" />
                        Admin
                      </Badge>
                    )}

                    {updatingId === user.id && (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
                    )}

                    <Select
                      value={user.role || "user"}
                      onValueChange={(v) => handleRoleChange(user.id, v)}
                      disabled={updatingId === user.id}
                    >
                      <SelectTrigger className="w-28 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="user">Usuário</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={user.tipo_gestor || "nenhum"}
                      onValueChange={(v) => handleGestorChange(user.id, v)}
                      disabled={updatingId === user.id}
                    >
                      <SelectTrigger className="w-40 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nenhum">Sem relatório</SelectItem>
                        <SelectItem value="geral">Gestor Geral</SelectItem>
                        <SelectItem value="pedagogico">
                          Gestor Pedagógico
                        </SelectItem>
                        <SelectItem value="administrativo">
                          Gestor Administrativo
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-600" />
              Cadastrar Gestor
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="email"
                  placeholder="gestor@exemplo.com"
                  className="pl-9"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isInviting) handleInvite();
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Função</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Gestor</Label>
                <Select value={inviteGestor} onValueChange={setInviteGestor}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhum">Sem relatório</SelectItem>
                    <SelectItem value="geral">Gestor Geral</SelectItem>
                    <SelectItem value="pedagogico">
                      Gestor Pedagógico
                    </SelectItem>
                    <SelectItem value="administrativo">
                      Gestor Administrativo
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInviteOpen(false)}
              disabled={isInviting}
            >
              Cancelar
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleInvite}
              disabled={isInviting || !inviteEmail.trim()}
            >
              {isInviting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Enviar Convite"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
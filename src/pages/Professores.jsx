import React, { useState, useEffect } from "react";
import { Professor } from "@/entities/Professor";
import { User as UserEntity } from "@/entities/User";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Plus,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Camera,
  Building2,
  Check,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProfessorForm from "@/components/ponto/ProfessorForm";

export default function Professores() {
  const [professores, setProfessores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadProfessores();
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setCurrentUser(await UserEntity.me());
    } catch {
      // not logged in
    }
  };

  const loadProfessores = async () => {
    setIsLoading(true);
    try {
      const data = await Professor.list("-created_date");
      setProfessores(data);
    } catch (error) {
      console.error("Erro:", error);
    }
    setIsLoading(false);
  };

  const isAdmin = currentUser?.role === "admin";
  const isGestor = !!currentUser?.tipo_gestor;
  const canApprove = isAdmin || isGestor;

  const handleSave = async (formData) => {
    try {
      if (editingProfessor) {
        await Professor.update(editingProfessor.id, formData);
      } else {
        await Professor.create({
          ...formData,
          status_aprovacao: "pendente",
          ativo: false,
        });
      }
      setFormOpen(false);
      setEditingProfessor(null);
      loadProfessores();
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  };

  const handleDelete = async (professor) => {
    if (!confirm(`Excluir ${professor.nome}?`)) return;
    await Professor.delete(professor.id);
    loadProfessores();
  };

  const handleEdit = (professor) => {
    setEditingProfessor(professor);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditingProfessor(null);
    setFormOpen(true);
  };

  const handleAprovar = async (professor) => {
    setActionLoading(professor.id);
    try {
      await base44.functions.invoke("aprovarProfessor", {
        professorId: professor.id,
        acao: "aprovar",
      });
      loadProfessores();
    } catch (error) {
      console.error("Erro ao aprovar:", error);
    }
    setActionLoading(null);
  };

  const handleRejeitar = async (professor) => {
    setActionLoading(professor.id);
    try {
      await base44.functions.invoke("aprovarProfessor", {
        professorId: professor.id,
        acao: "rejeitar",
      });
      loadProfessores();
    } catch (error) {
      console.error("Erro ao rejeitar:", error);
    }
    setActionLoading(null);
  };

  const renderStatusBadge = (prof) => {
    if (prof.status_aprovacao === "pendente") {
      return (
        <Badge className="text-xs flex-shrink-0 bg-amber-50 text-amber-700 border-0">
          Pendente
        </Badge>
      );
    }
    if (prof.status_aprovacao === "rejeitado") {
      return (
        <Badge className="text-xs flex-shrink-0 bg-red-50 text-red-700 border-0">
          Rejeitado
        </Badge>
      );
    }
    return (
      <Badge
        variant={prof.ativo ? "default" : "secondary"}
        className="text-xs flex-shrink-0"
      >
        {prof.ativo ? "Ativo" : "Inativo"}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/50 p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
              Professores
            </h1>
            <p className="text-slate-500">
              {isAdmin
                ? "Cadastre professores e aprove os cadastros pendentes"
                : "Aprove os cadastros pendentes dos professores"}
            </p>
          </div>
          {isAdmin && (
            <Button
              onClick={handleAdd}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4 mr-2" /> Cadastrar
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <Card key={i} className="border-0 shadow-md animate-pulse">
                  <CardContent className="p-5">
                    <div className="h-20 bg-slate-100 rounded w-full"></div>
                  </CardContent>
                </Card>
              ))}
          </div>
        ) : professores.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="p-12 text-center">
              <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Nenhum professor cadastrado
              </h3>
              <p className="text-slate-500 mb-4">
                {isAdmin
                  ? "Cadastre professores com foto para habilitar a batida por Face ID"
                  : "Não há cadastros para aprovar no momento"}
              </p>
              {isAdmin && (
                <Button
                  onClick={handleAdd}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="w-4 h-4 mr-2" /> Cadastrar Professor
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {professores.map((prof, index) => (
                <motion.div
                  key={prof.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-full bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {prof.foto_url ? (
                            <img
                              src={prof.foto_url}
                              alt={prof.nome}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-6 h-6 text-slate-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 truncate">
                                {prof.nome}
                              </p>
                              {prof.disciplina && (
                                <p className="text-sm text-slate-500">
                                  {prof.disciplina}
                                </p>
                              )}
                            </div>
                            {renderStatusBadge(prof)}
                          </div>
                          <div className="mt-2 space-y-1">
                            {prof.email && (
                              <p className="text-xs text-slate-500 flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {prof.email}
                              </p>
                            )}
                            {prof.telefone && (
                              <p className="text-xs text-slate-500 flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {prof.telefone}
                              </p>
                            )}
                            {prof.unidade && (
                              <p className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
                                <Building2 className="w-3 h-3" /> {prof.unidade}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-3 flex-wrap">
                            {prof.status_aprovacao === "pendente" &&
                              canApprove && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                    onClick={() => handleAprovar(prof)}
                                    disabled={actionLoading === prof.id}
                                  >
                                    <Check className="w-3.5 h-3.5 mr-1" /> Aprovar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-500 border-red-200 hover:bg-red-50"
                                    onClick={() => handleRejeitar(prof)}
                                    disabled={actionLoading === prof.id}
                                  >
                                    <X className="w-3.5 h-3.5 mr-1" /> Rejeitar
                                  </Button>
                                </>
                              )}
                            {isAdmin && prof.status_aprovacao !== "pendente" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(prof)}
                              >
                                <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
                              </Button>
                            )}
                            {isAdmin && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => handleDelete(prof)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            {!prof.foto_url && (
                              <span className="text-xs text-amber-600 flex items-center gap-1 ml-auto">
                                <Camera className="w-3 h-3" /> Sem foto
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <ProfessorForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingProfessor(null);
        }}
        onSave={handleSave}
        professor={editingProfessor}
      />
    </div>
  );
}
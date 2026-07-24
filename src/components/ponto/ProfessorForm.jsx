import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload, Loader2, Check } from "lucide-react";
import { UploadFile } from "@/api/integrations";

export default function ProfessorForm({
  open,
  onClose,
  onSave,
  professor,
}) {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    matricula: "",
    disciplina: "",
    foto_url: "",
    ativo: true,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (professor) {
      setFormData({
        nome: professor.nome || "",
        email: professor.email || "",
        telefone: professor.telefone || "",
        matricula: professor.matricula || "",
        disciplina: professor.disciplina || "",
        foto_url: professor.foto_url || "",
        ativo: professor.ativo !== false,
      });
    } else {
      setFormData({
        nome: "",
        email: "",
        telefone: "",
        matricula: "",
        disciplina: "",
        foto_url: "",
        ativo: true,
      });
    }
  }, [professor, open]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setFormData((prev) => ({ ...prev, foto_url: file_url }));
    } catch (error) {
      console.error("Erro ao fazer upload da foto:", error);
    }
    setIsUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome) return;
    setIsSaving(true);
    await onSave(formData);
    setIsSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {professor ? "Editar Professor" : "Cadastrar Professor"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center border-2 border-slate-200">
              {formData.foto_url ? (
                <img
                  src={formData.foto_url}
                  alt="Foto"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera className="w-8 h-8 text-slate-300" />
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {formData.foto_url ? "Trocar foto" : "Enviar foto"}
                </>
              )}
            </Button>
            {formData.foto_url && (
              <p className="text-xs text-emerald-600 flex items-center gap-1">
                <Check className="w-3 h-3" /> Foto cadastrada para Face ID
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label htmlFor="nome">Nome completo *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                required
                placeholder="Ex: João Silva"
              />
            </div>
            <div>
              <Label htmlFor="matricula">Matrícula</Label>
              <Input
                id="matricula"
                value={formData.matricula}
                onChange={(e) =>
                  setFormData({ ...formData, matricula: e.target.value })
                }
                placeholder="Ex: 12345"
              />
            </div>
            <div>
              <Label htmlFor="disciplina">Disciplina</Label>
              <Input
                id="disciplina"
                value={formData.disciplina}
                onChange={(e) =>
                  setFormData({ ...formData, disciplina: e.target.value })
                }
                placeholder="Ex: Matemática"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="email@escola.com"
              />
            </div>
            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) =>
                  setFormData({ ...formData, telefone: e.target.value })
                }
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
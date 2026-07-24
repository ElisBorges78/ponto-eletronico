import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RegistroPonto } from "@/entities/RegistroPonto";
import { User } from "@/entities/User";
import { Save, Loader2, Shield } from "lucide-react";

function toDatetimeLocal(isoString) {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  } catch {
    return "";
  }
}

function fromDatetimeLocal(value) {
  if (!value) return null;
  return new Date(value).toISOString();
}

const fields = [
  { key: "entrada", label: "Entrada" },
  { key: "saida_almoco", label: "Saída para Almoço" },
  { key: "retorno_almoco", label: "Retorno do Almoço" },
  { key: "saida", label: "Saída" },
];

export default function AjusteModal({ open, onClose, registro, onSaved }) {
  const [times, setTimes] = useState({
    entrada: "",
    saida_almoco: "",
    retorno_almoco: "",
    saida: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (registro) {
      setTimes({
        entrada: toDatetimeLocal(registro.entrada),
        saida_almoco: toDatetimeLocal(registro.saida_almoco),
        retorno_almoco: toDatetimeLocal(registro.retorno_almoco),
        saida: toDatetimeLocal(registro.saida),
      });
    }
  }, [registro, open]);

  const handleChange = (key, value) => {
    setTimes((prev) => ({ ...prev, [key]: value }));
  };

  const handleClear = (key) => {
    setTimes((prev) => ({ ...prev, [key]: "" }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const user = await User.me();
      const updateData = {
        entrada: fromDatetimeLocal(times.entrada),
        saida_almoco: fromDatetimeLocal(times.saida_almoco),
        retorno_almoco: fromDatetimeLocal(times.retorno_almoco),
        saida: fromDatetimeLocal(times.saida),
        ajustado_por: user.email,
      };
      await RegistroPonto.update(registro.id, updateData);
      onSaved();
      onClose();
    } catch (error) {
      console.error("Erro ao ajustar registro:", error);
    }
    setIsSaving(false);
  };

  if (!registro) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            Ajustar Horário
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-1 mb-4 pb-4 border-b border-slate-100">
          <p className="font-semibold text-slate-900">
            {registro.professor_nome || "Registro"}
          </p>
          <p className="text-sm text-slate-500">
            {registro.data}
          </p>
          {registro.ajustado_por && (
            <p className="text-xs text-amber-600 mt-1">
              Último ajuste por: {registro.ajustado_por}
            </p>
          )}
        </div>

        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.key}>
              <div className="flex items-center justify-between mb-1">
                <Label>{field.label}</Label>
                {times[field.key] && (
                  <button
                    type="button"
                    onClick={() => handleClear(field.key)}
                    className="text-xs text-slate-400 hover:text-red-500"
                  >
                    Limpar
                  </button>
                )}
              </div>
              <Input
                type="datetime-local"
                value={times[field.key]}
                onChange={(e) => handleChange(field.key, e.target.value)}
              />
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar Ajuste
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
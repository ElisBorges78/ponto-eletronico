import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, ShieldAlert } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function SenhaGate({
  open,
  onClose,
  onSuccess,
  title = "Acesso restrito",
  description = "Digite a senha de administrador para continuar.",
  confirmLabel = "Confirmar",
}) {
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setSenha("");
    setError("");
    onClose?.();
  };

  const handleValidate = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await base44.functions.invoke("validarSenhaAdmin", { senha });
      if (response.data?.valid) {
        setSenha("");
        setError("");
        onSuccess?.();
      } else {
        setError("Senha incorreta. Tente novamente.");
      }
    } catch {
      setError("Erro ao validar a senha. Verifique sua conexão.");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-2">
            <Lock className="w-6 h-6 text-emerald-600" />
          </div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleValidate} className="space-y-3">
          <Input
            type="password"
            placeholder="Senha de administrador"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoFocus
            className="h-11"
          />

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-2.5">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            {onClose && (
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={loading || !senha} className="bg-emerald-600 hover:bg-emerald-700">
              {loading ? "Validando..." : confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
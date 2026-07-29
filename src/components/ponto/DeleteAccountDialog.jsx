import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

export default function DeleteAccountDialog({ open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setLoading(true);
    setError("");
    try {
      await base44.functions.invoke("excluirConta", {});
      await User.logout();
      window.location.reload();
    } catch (e) {
      setError(e.message || "Não foi possível excluir a conta.");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" /> Excluir minha conta
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-3">
          <p className="text-sm text-slate-600">
            Esta ação é irreversível. Todos os seus dados serão removidos e você
            será desconectado do sistema.
          </p>
          <p className="text-sm font-medium text-slate-700">
            Tem certeza que deseja excluir sua conta permanentemente?
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Excluir conta"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
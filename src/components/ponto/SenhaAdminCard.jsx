import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

export default function SenhaAdminCard() {
  const { toast } = useToast();
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (novaSenha !== confirmar) {
      toast({ title: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    if (novaSenha.length < 4) {
      toast({
        title: "A nova senha deve ter pelo menos 4 caracteres",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      await base44.functions.invoke("alterarSenhaAdmin", {
        senhaAtual,
        novaSenha,
      });
      toast({ title: "Senha alterada com sucesso!" });
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmar("");
    } catch (error) {
      toast({
        title: "Erro ao alterar senha",
        description:
          error.response?.data?.error || "Tente novamente.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <KeyRound className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-slate-900">
              Senha do Painel
            </h3>
          </div>
          <p className="text-sm text-slate-500 mb-6">
            Altere a senha de acesso ao painel administrativo
          </p>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
            <div className="space-y-2">
              <Label>Senha atual</Label>
              <Input
                type="password"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Nova senha</Label>
              <Input
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Confirmar nova senha</Label>
              <Input
                type="password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4 mr-2" />
              )}
              Alterar senha
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
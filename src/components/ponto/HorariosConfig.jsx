import React, { useState, useEffect } from "react";
import { Configuracao } from "@/entities/Configuracao";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

export default function HorariosConfig() {
  const { toast } = useToast();
  const [horaAbertura, setHoraAbertura] = useState("");
  const [horaFechamento, setHoraFechamento] = useState("");
  const [regras, setRegras] = useState("");
  const [configId, setConfigId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const configs = await Configuracao.list();
      if (configs.length > 0) {
        const config = configs[0];
        setConfigId(config.id);
        setHoraAbertura(config.hora_abertura || "");
        setHoraFechamento(config.hora_fechamento || "");
        setRegras(config.regras_descricao || "");
      }
    } catch (error) {
      console.error("Erro ao carregar configuração:", error);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        hora_abertura: horaAbertura || null,
        hora_fechamento: horaFechamento || null,
        regras_descricao: regras || null,
      };
      if (configId) {
        await Configuracao.update(configId, data);
      } else {
        const created = await Configuracao.create(data);
        setConfigId(created.id);
      }
      toast({
        title: "Regras atualizadas!",
        description: "Professores serão notificados por email.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    }
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-slate-900">
              Horários de Registro
            </h3>
          </div>
          <p className="text-sm text-slate-500 mb-6">
            Defina o horário permitido e as regras. Professores serão notificados
            automaticamente ao salvar.
          </p>
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                <div className="space-y-2">
                  <Label>Abertura</Label>
                  <Input
                    type="time"
                    value={horaAbertura}
                    onChange={(e) => setHoraAbertura(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fechamento</Label>
                  <Input
                    type="time"
                    value={horaFechamento}
                    onChange={(e) => setHoraFechamento(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Regras e observações</Label>
                <Textarea
                  placeholder="Descreva as regras de registro de ponto..."
                  value={regras}
                  onChange={(e) => setRegras(e.target.value)}
                  rows={3}
                />
              </div>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {saving && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Salvar e notificar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
import React, { useState, useEffect } from "react";
import { Configuracao } from "@/entities/Configuracao";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Settings, Loader2, Save } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

export default function ConfiguracaoPontoCard() {
  const { toast } = useToast();
  const [configId, setConfigId] = useState(null);
  const [restricoesAtivas, setRestricoesAtivas] = useState(false);
  const [horaMinEntrada, setHoraMinEntrada] = useState("");
  const [horaMaxEntrada, setHoraMaxEntrada] = useState("");
  const [horaMinSaida, setHoraMinSaida] = useState("");
  const [horaMaxSaida, setHoraMaxSaida] = useState("");
  const [mensagemRegras, setMensagemRegras] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const configs = await Configuracao.list();
      if (configs.length > 0) {
        const c = configs[0];
        setConfigId(c.id);
        setRestricoesAtivas(c.restricoes_ativas || false);
        setHoraMinEntrada(c.hora_min_entrada || "");
        setHoraMaxEntrada(c.hora_max_entrada || "");
        setHoraMinSaida(c.hora_min_saida || "");
        setHoraMaxSaida(c.hora_max_saida || "");
        setMensagemRegras(c.mensagem_regras || "");
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
        restricoes_ativas: restricoesAtivas,
        hora_min_entrada: horaMinEntrada || null,
        hora_max_entrada: horaMaxEntrada || null,
        hora_min_saida: horaMinSaida || null,
        hora_max_saida: horaMaxSaida || null,
        mensagem_regras: mensagemRegras || null,
      };
      if (configId) {
        await Configuracao.update(configId, data);
      } else {
        const created = await Configuracao.create(data);
        setConfigId(created.id);
      }
      toast({
        title: "Regras salvas!",
        description: "Os professores foram notificados por email.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-slate-900">
              Regras de Registro de Ponto
            </h3>
          </div>
          <p className="text-sm text-slate-500 mb-6">
            Defina restrições de horário. Professores serão notificados por
            email ao salvar.
          </p>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl mb-4">
            <div>
              <p className="font-medium text-slate-900 text-sm">
                Ativar restrições de horário
              </p>
              <p className="text-xs text-slate-500">
                Bloqueia registros fora do horário permitido
              </p>
            </div>
            <Switch checked={restricoesAtivas} onCheckedChange={setRestricoesAtivas} />
          </div>

          {restricoesAtivas && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Entrada a partir de</Label>
                  <Input
                    type="time"
                    value={horaMinEntrada}
                    onChange={(e) => setHoraMinEntrada(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Entrada até</Label>
                  <Input
                    type="time"
                    value={horaMaxEntrada}
                    onChange={(e) => setHoraMaxEntrada(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Saída a partir de</Label>
                  <Input
                    type="time"
                    value={horaMinSaida}
                    onChange={(e) => setHoraMinSaida(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Saída até</Label>
                  <Input
                    type="time"
                    value={horaMaxSaida}
                    onChange={(e) => setHoraMaxSaida(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2 mt-4">
            <Label>Mensagem para os professores</Label>
            <Textarea
              placeholder="Ex: Lembrem-se de bater o ponto dentro do horário estabelecido..."
              value={mensagemRegras}
              onChange={(e) => setMensagemRegras(e.target.value)}
              rows={3}
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 mt-4"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar regras
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
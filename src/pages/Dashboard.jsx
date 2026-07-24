import React, { useState, useEffect, useCallback } from "react";
import { RegistroPonto } from "@/entities/RegistroPonto";
import { User } from "@/entities/User";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LogIn,
  Coffee,
  LogOut,
  DoorOpen,
  Clock,
  PlayCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  formatarHora,
  getDataHoje,
  calcularMinutosTrabalhados,
  calcularMinutosPausa,
  formatarHoras,
  getStatus,
  getProximaAcao,
  STATUS_CONFIG,
  getSaudacao,
} from "@/lib/pontoUtils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [registro, setRegistro] = useState(null);
  const [agora, setAgora] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    loadUser();
    loadRegistro();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch {
      // not logged in
    }
  };

  const loadRegistro = useCallback(async () => {
    setIsLoading(true);
    try {
      const hoje = getDataHoje();
      const registros = await RegistroPonto.filter({ data: hoje });
      if (registros.length > 0) {
        setRegistro(registros[0]);
      } else {
        setRegistro(null);
      }
    } catch (error) {
      console.error("Erro ao carregar registro:", error);
    }
    setIsLoading(false);
  }, []);

  const registrarEntrada = async () => {
    setIsActionLoading(true);
    try {
      const novo = await RegistroPonto.create({
        data: getDataHoje(),
        entrada: new Date().toISOString(),
      });
      setRegistro(novo);
    } catch (error) {
      console.error("Erro ao registrar entrada:", error);
    }
    setIsActionLoading(false);
  };

  const atualizarCampo = async (campo) => {
    if (!registro) return;
    setIsActionLoading(true);
    try {
      const atualizado = await RegistroPonto.update(registro.id, {
        [campo]: new Date().toISOString(),
      });
      setRegistro(atualizado);
    } catch (error) {
      console.error("Erro ao atualizar registro:", error);
    }
    setIsActionLoading(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-emerald-50 to-teal-50">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-emerald-600 rounded-2xl flex items-center justify-center">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Ponto Eletrônico
            </h2>
            <p className="text-slate-500 mb-6">
              Faça login para registrar seu ponto e acompanhar suas horas
              trabalhadas
            </p>
            <Button
              onClick={() => User.login()}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              Entrar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = getStatus(registro);
  const statusConfig = STATUS_CONFIG[status];
  const proximaAcao = getProximaAcao(registro);
  const minutosTrabalhados = calcularMinutosTrabalhados(registro, agora);
  const minutosPausa = calcularMinutosPausa(registro, agora);

  const timeline = [
    {
      key: "entrada",
      label: "Entrada",
      icon: LogIn,
      time: registro?.entrada,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      key: "saida_almoco",
      label: "Saída p/ almoço",
      icon: Coffee,
      time: registro?.saida_almoco,
      color: "text-amber-600 bg-amber-50",
    },
    {
      key: "retorno_almoco",
      label: "Retorno do almoço",
      icon: LogOut,
      time: registro?.retorno_almoco,
      color: "text-amber-600 bg-amber-50",
    },
    {
      key: "saida",
      label: "Saída",
      icon: DoorOpen,
      time: registro?.saida,
      color: "text-blue-600 bg-blue-50",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/50 p-4 lg:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <p className="text-sm text-slate-500 mb-1">
            {getSaudacao()}, {user.full_name?.split(" ")[0] || "Usuário"} 👋
          </p>
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900">
            {format(agora, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </h1>
        </motion.div>

        {/* Live Clock + Status */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6"
        >
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="bg-slate-900 px-6 py-8 lg:px-10 lg:py-10">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                <div className="text-center lg:text-left">
                  <p className="text-emerald-400 text-sm font-medium mb-2">
                    Horário atual
                  </p>
                  <div className="text-5xl lg:text-6xl font-bold text-white tabular-nums tracking-tight">
                    {format(agora, "HH:mm")}
                    <span className="text-2xl text-slate-400 ml-2">
                      {format(agora, "ss")}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-center lg:items-end gap-2">
                  <span
                    className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium ${statusConfig.badge}`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${statusConfig.dot} ${
                        status === "trabalhando" || status === "pausa"
                          ? "animate-pulse"
                          : ""
                      }`}
                    />
                    {statusConfig.label}
                  </span>
                  <p className="text-slate-400 text-sm">Tempo de trabalho hoje</p>
                  <p className="text-3xl font-bold text-white tabular-nums">
                    {formatarHoras(minutosTrabalhados)}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          {proximaAcao !== "nenhuma" ? (
            <Button
              onClick={() =>
                proximaAcao === "entrada"
                  ? registrarEntrada()
                  : atualizarCampo(proximaAcao)
              }
              disabled={isActionLoading}
              className="w-full h-16 text-lg font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
            >
              <PlayCircle className="w-6 h-6 mr-3" />
              {proximaAcao === "entrada" && "Registrar Entrada"}
              {proximaAcao === "saida_almoco" && "Saída para Almoço"}
              {proximaAcao === "retorno_almoco" && "Retorno do Almoço"}
              {proximaAcao === "saida" && "Registrar Saída"}
            </Button>
          ) : (
            <div className="w-full h-16 flex items-center justify-center text-slate-500 bg-slate-100 rounded-xl text-sm font-medium">
              Expediente de hoje concluído ✅
            </div>
          )}
        </motion.div>

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                Registro de hoje
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                {isLoading
                  ? "Carregando..."
                  : registro
                  ? "Acompanhe suas marcações"
                  : "Nenhuma marcação registrada ainda"}
              </p>

              <div className="space-y-1">
                {timeline.map((item, index) => (
                  <div key={item.key}>
                    <div className="flex items-center gap-4 py-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          item.time ? item.color : "bg-slate-50 text-slate-300"
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-medium ${
                            item.time ? "text-slate-900" : "text-slate-400"
                          }`}
                        >
                          {item.label}
                        </p>
                      </div>
                      <div className="text-right">
                        <AnimatePresence mode="wait">
                          <motion.p
                            key={item.time || "empty"}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`text-lg font-semibold tabular-nums ${
                              item.time ? "text-slate-900" : "text-slate-300"
                            }`}
                          >
                            {formatarHora(item.time)}
                          </motion.p>
                        </AnimatePresence>
                      </div>
                    </div>
                    {index < timeline.length - 1 && (
                      <div className="ml-5.5 h-px bg-slate-100" />
                    )}
                  </div>
                ))}
              </div>

              {/* Summary */}
              {registro && (
                <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-slate-100">
                  <div className="bg-emerald-50 rounded-xl p-4">
                    <p className="text-xs text-emerald-700 font-medium mb-1">
                      Tempo trabalhado
                    </p>
                    <p className="text-2xl font-bold text-emerald-900 tabular-nums">
                      {formatarHoras(minutosTrabalhados)}
                    </p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-4">
                    <p className="text-xs text-amber-700 font-medium mb-1">
                      Tempo de pausa
                    </p>
                    <p className="text-2xl font-bold text-amber-900 tabular-nums">
                      {formatarHoras(minutosPausa)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
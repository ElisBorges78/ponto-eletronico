import React, { useState, useEffect, useMemo } from "react";
import { RegistroPonto } from "@/entities/RegistroPonto";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, Coffee, DoorOpen, LogIn, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO, isSameMonth, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  formatarHora,
  formatarDataCurta,
  getDiaSemana,
  calcularMinutosTrabalhados,
  formatarHoras,
  getStatus,
  STATUS_CONFIG,
} from "@/lib/pontoUtils";

export default function Projects() {
  const [registros, setRegistros] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroMes, setFiltroMes] = useState("");

  useEffect(() => {
    loadRegistros();
  }, []);

  const loadRegistros = async () => {
    setIsLoading(true);
    try {
      const data = await RegistroPonto.list("-data");
      setRegistros(data);
    } catch (error) {
      console.error("Erro ao carregar registros:", error);
    }
    setIsLoading(false);
  };

  const registrosFiltrados = useMemo(() => {
    if (!filtroMes) return registros;
    const [ano, mes] = filtroMes.split("-").map(Number);
    return registros.filter((r) => {
      try {
        const data = parseISO(r.data);
        return data.getFullYear() === ano && data.getMonth() === mes - 1;
      } catch {
        return false;
      }
    });
  }, [registros, filtroMes]);

  const totalMinutos = useMemo(
    () =>
      registrosFiltrados.reduce(
        (acc, r) => acc + calcularMinutosTrabalhados(r),
        0
      ),
    [registrosFiltrados]
  );

  const diasTrabalhados = registrosFiltrados.filter(
    (r) => r.entrada
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/50 p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
            Histórico
          </h1>
          <p className="text-slate-500">
            Acompanhe seus registros de ponto anteriores
          </p>
        </motion.div>

        {/* Summary + Filter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <Card className="border-0 shadow-md">
            <CardContent className="p-5">
              <p className="text-xs text-slate-500 font-medium mb-1">
                Horas no período
              </p>
              <p className="text-2xl font-bold text-emerald-700 tabular-nums">
                {formatarHoras(totalMinutos)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-5">
              <p className="text-xs text-slate-500 font-medium mb-1">
                Dias trabalhados
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {diasTrabalhados}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-5">
              <p className="text-xs text-slate-500 font-medium mb-1">
                Filtrar por mês
              </p>
              <Input
                type="month"
                value={filtroMes}
                onChange={(e) => setFiltroMes(e.target.value)}
                className="border-0 px-0 h-7 text-base font-semibold text-slate-900 focus-visible:ring-0"
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Records */}
        {isLoading ? (
          <div className="space-y-4">
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <Card key={i} className="border-0 shadow-md animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-5 bg-slate-100 rounded w-1/3 mb-4"></div>
                    <div className="flex gap-8">
                      {[1, 2, 3, 4].map((n) => (
                        <div key={n} className="flex-1">
                          <div className="h-3 bg-slate-50 rounded w-16 mb-2"></div>
                          <div className="h-5 bg-slate-100 rounded w-14"></div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        ) : registrosFiltrados.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="p-12 text-center">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Nenhum registro encontrado
              </h3>
              <p className="text-slate-500">
                {filtroMes
                  ? "Não há registros para o mês selecionado"
                  : "Comece registrando seu ponto na aba Registrar Ponto"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {registrosFiltrados.map((registro, index) => {
                const status = getStatus(registro);
                const statusConfig = STATUS_CONFIG[status];
                const minutos = calcularMinutosTrabalhados(registro);

                const timeline = [
                  { label: "Entrada", icon: LogIn, time: registro.entrada },
                  { label: "Almoço", icon: Coffee, time: registro.saida_almoco },
                  { label: "Retorno", icon: LogOut, time: registro.retorno_almoco },
                  { label: "Saída", icon: DoorOpen, time: registro.saida },
                ];

                return (
                  <motion.div
                    key={registro.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                      <CardContent className="p-5 lg:p-6">
                        {/* Date header */}
                        <div className="flex items-center justify-between mb-5">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {getDiaSemana(registro.data)}
                            </p>
                            <p className="text-sm text-slate-500">
                              {formatarDataCurta(registro.data)}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-xs text-slate-500">
                                Horas trabalhadas
                              </p>
                              <p className="font-bold text-emerald-700 tabular-nums">
                                {formatarHoras(minutos)}
                              </p>
                            </div>
                            <Badge
                              className={`${statusConfig.badge} border-0 font-medium`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot} mr-1.5`}
                              />
                              {statusConfig.label}
                            </Badge>
                          </div>
                        </div>

                        {/* Timeline */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {timeline.map((item) => (
                            <div
                              key={item.label}
                              className="flex items-center gap-3"
                            >
                              <div
                                className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  item.time
                                    ? "bg-emerald-50 text-emerald-600"
                                    : "bg-slate-50 text-slate-300"
                                }`}
                              >
                                <item.icon className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">
                                  {item.label}
                                </p>
                                <p
                                  className={`text-sm font-semibold tabular-nums ${
                                    item.time
                                      ? "text-slate-900"
                                      : "text-slate-300"
                                  }`}
                                >
                                  {formatarHora(item.time)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
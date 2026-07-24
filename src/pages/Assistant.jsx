import React, { useState, useEffect, useMemo } from "react";
import { RegistroPonto } from "@/entities/RegistroPonto";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { TrendingUp, Calendar, Clock, Award } from "lucide-react";
import { motion } from "framer-motion";
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  parseISO,
  isSameDay,
  subWeeks,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  calcularMinutosTrabalhados,
  formatarHoras,
  formatarHorasDecimal,
} from "@/lib/pontoUtils";

const DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function getSemanaAtual(offset = 0) {
  const inicio = startOfWeek(subWeeks(new Date(), offset), { weekStartsOn: 1 });
  const fim = endOfWeek(subWeeks(new Date(), offset), { weekStartsOn: 1 });
  return eachDayOfInterval({ start: inicio, end: fim });
}

export default function Assistant() {
  const [registros, setRegistros] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [semanaOffset, setSemanaOffset] = useState(0);

  useEffect(() => {
    loadRegistros();
  }, []);

  const loadRegistros = async () => {
    setIsLoading(true);
    try {
      const data = await RegistroPonto.list("-data", 100);
      setRegistros(data);
    } catch (error) {
      console.error("Erro ao carregar registros:", error);
    }
    setIsLoading(false);
  };

  const diasSemana = useMemo(() => getSemanaAtual(semanaOffset), [semanaOffset]);

  const chartData = useMemo(() => {
    return diasSemana.map((dia) => {
      const registro = registros.find((r) => {
        try {
          return r.data && isSameDay(parseISO(r.data), dia);
        } catch {
          return false;
        }
      });
      const minutos = registro
        ? calcularMinutosTrabalhados(registro)
        : 0;
      return {
        dia: format(dia, "EEE", { locale: ptBR }),
        horas: Number((minutos / 60).toFixed(1)),
        minutos,
      };
    });
  }, [diasSemana, registros]);

  const totalMinutosSemana = chartData.reduce((acc, d) => acc + d.minutos, 0);
  const diasTrabalhados = chartData.filter((d) => d.minutos > 0).length;
  const mediaMinutos = diasTrabalhados > 0 ? totalMinutosSemana / diasTrabalhados : 0;

  const labelSemana =
    semanaOffset === 0
      ? "Esta semana"
      : semanaOffset === 1
      ? "Semana passada"
      : `${semanaOffset} semanas atrás`;

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
            Relatórios
          </h1>
          <p className="text-slate-500">
            Acompanhe suas horas trabalhadas por semana
          </p>
        </motion.div>

        {/* Week navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSemanaOffset((s) => s + 1)}
              className="w-10 h-10 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors"
            >
              ‹
            </button>
            <span className="font-semibold text-slate-900 min-w-[140px] text-center">
              {labelSemana}
            </span>
            {semanaOffset > 0 && (
              <button
                onClick={() => setSemanaOffset((s) => Math.max(0, s - 1))}
                className="w-10 h-10 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors"
              >
                ›
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <Card className="border-0 shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-500 font-medium">
                  Total da semana
                </p>
                <Clock className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">
                {formatarHoras(totalMinutosSemana)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-500 font-medium">
                  Dias trabalhados
                </p>
                <Calendar className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {diasTrabalhados}
                <span className="text-sm text-slate-400 font-normal ml-1">
                  / 7
                </span>
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-500 font-medium">
                  Média por dia
                </p>
                <TrendingUp className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">
                {formatarHorasDecimal(mediaMinutos)}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-md mb-8">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                Horas por dia
              </h3>
              <p className="text-sm text-slate-500 mb-6">{labelSemana}</p>

              {isLoading ? (
                <div className="h-64 bg-slate-50 rounded-xl animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="dia"
                      tick={{ fontSize: 12, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${v}h`}
                    />
                    <Tooltip
                      cursor={{ fill: "#f0fdf4" }}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        fontSize: "13px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      }}
                      formatter={(value, name) => [
                        formatarHoras(value * 60),
                        "Trabalhado",
                      ]}
                    />
                    <Bar
                      dataKey="horas"
                      fill="#059669"
                      radius={[8, 8, 0, 0]}
                      maxBarSize={56}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Day by day breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Detalhamento
              </h3>
              <div className="space-y-2">
                {chartData.map((dia, index) => {
                  const data = diasSemana[index];
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
                          <span className="text-sm font-semibold text-slate-600">
                            {format(data, "dd")}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 capitalize">
                            {format(data, "EEEE", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {dia.minutos > 0 && (
                          <Award className="w-4 h-4 text-emerald-500" />
                        )}
                        <span
                          className={`font-semibold tabular-nums ${
                            dia.minutos > 0
                              ? "text-slate-900"
                              : "text-slate-300"
                          }`}
                        >
                          {dia.minutos > 0
                            ? formatarHoras(dia.minutos)
                            : "—"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
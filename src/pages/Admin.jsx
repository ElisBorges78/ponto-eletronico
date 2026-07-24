import React, { useState, useEffect, useMemo } from "react";
import { RegistroPonto } from "@/entities/RegistroPonto";
import { Professor } from "@/entities/Professor";
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
import {
  Users,
  Clock,
  Calendar,
  TrendingUp,
  Activity,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  parseISO,
  isSameMonth,
  format,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  calcularMinutosTrabalhados,
  formatarHoras,
  formatarHorasDecimal,
  formatarHora,
  getDataHoje,
  getStatus,
  STATUS_CONFIG,
} from "@/lib/pontoUtils";
import ProfessorStatsTable from "@/components/ponto/ProfessorStatsTable";
import SenhaGate from "@/components/ponto/SenhaGate";
import UserManagement from "@/components/ponto/UserManagement";

export default function Admin() {
  const [registros, setRegistros] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroMes, setFiltroMes] = useState(format(new Date(), "yyyy-MM"));
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem("admin_unlocked") === "true");

  const handleUnlock = () => {
    setUnlocked(true);
    sessionStorage.setItem("admin_unlocked", "true");
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [regs, profs] = await Promise.all([
        RegistroPonto.list("-data", 500),
        Professor.list(),
      ]);
      setRegistros(regs);
      setProfessores(profs);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
    setIsLoading(false);
  };

  const mesRef = useMemo(() => parseISO(filtroMes + "-01"), [filtroMes]);

  const registrosMes = useMemo(() => {
    return registros.filter((r) => {
      try {
        return r.data && isSameMonth(parseISO(r.data), mesRef);
      } catch {
        return false;
      }
    });
  }, [registros, mesRef]);

  const totalMinutosMes = useMemo(
    () =>
      registrosMes.reduce(
        (acc, r) => acc + calcularMinutosTrabalhados(r),
        0
      ),
    [registrosMes]
  );

  const totalDias = useMemo(
    () => new Set(registrosMes.map((r) => r.data)).size,
    [registrosMes]
  );

  const registrosHoje = useMemo(() => {
    const hoje = getDataHoje();
    return registros.filter((r) => r.data === hoje);
  }, [registros]);

  const presentesHoje = registrosHoje.filter((r) => r.entrada).length;
  const ativosAgora = registrosHoje.filter(
    (r) => r.entrada && !r.saida
  ).length;

  const chartData = useMemo(() => {
    const porProf = {};
    registrosMes.forEach((r) => {
      const nome = r.professor_nome || "Sem professor";
      if (!porProf[nome]) porProf[nome] = 0;
      porProf[nome] += calcularMinutosTrabalhados(r);
    });
    return Object.entries(porProf)
      .map(([nome, min]) => ({
        nome: nome.split(" ")[0],
        nomeCompleto: nome,
        horas: Number((min / 60).toFixed(1)),
        minutos: min,
      }))
      .sort((a, b) => b.minutos - a.minutos)
      .slice(0, 10);
  }, [registrosMes]);

  const atividadeRecente = useMemo(() => {
    return [...registros]
      .sort((a, b) => {
        const aTime = a.updated_date ? new Date(a.updated_date) : new Date(0);
        const bTime = b.updated_date ? new Date(b.updated_date) : new Date(0);
        return bTime - aTime;
      })
      .slice(0, 8);
  }, [registros]);

  if (!unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/50 p-4">
        <SenhaGate
          open={true}
          onSuccess={handleUnlock}
          title="Painel Administrativo"
          description="Digite a senha de administrador para acessar o painel."
          confirmLabel="Acessar painel"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/50 p-4 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
              Painel Administrativo
            </h1>
            <p className="text-slate-500">
              Visão consolidada de todos os professores e registros de ponto
            </p>
          </div>
          <input
            type="month"
            value={filtroMes}
            onChange={(e) => setFiltroMes(e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <Card className="border-0 shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-500 font-medium">Professores</p>
                <Users className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {professores.length}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {professores.filter((p) => p.ativo).length} ativos
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-500 font-medium">
                  Horas no mês
                </p>
                <Clock className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">
                {formatarHoras(totalMinutosMes)}
              </p>
              <p className="text-xs text-slate-400 mt-1">{totalDias} dias</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-500 font-medium">
                  Presentes hoje
                </p>
                <Calendar className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{presentesHoje}</p>
              <p className="text-xs text-slate-400 mt-1">
                {registrosHoje.length} registros
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-500 font-medium">
                  Ativos agora
                </p>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{ativosAgora}</p>
              <p className="text-xs text-slate-400 mt-1">em expediente</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Chart: Hours per Professor */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8"
        >
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                Horas por professor
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                {format(mesRef, "MMMM 'de' yyyy", { locale: ptBR })}
              </p>
              {isLoading ? (
                <div className="h-64 bg-slate-50 rounded-xl animate-pulse" />
              ) : chartData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
                  Sem registros no período
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 0, right: 20, left: 20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 12, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${v}h`}
                    />
                    <YAxis
                      type="category"
                      dataKey="nome"
                      tick={{ fontSize: 12, fill: "#475569" }}
                      axisLine={false}
                      tickLine={false}
                      width={80}
                    />
                    <Tooltip
                      cursor={{ fill: "#f0fdf4" }}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        fontSize: "13px",
                      }}
                      formatter={(value, name, props) => [
                        formatarHoras(props.payload.minutos),
                        props.payload.nomeCompleto,
                      ]}
                    />
                    <Bar
                      dataKey="horas"
                      fill="#059669"
                      radius={[0, 8, 8, 0]}
                      maxBarSize={32}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Professor Stats Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Resumo por professor
          </h3>
          <ProfessorStatsTable
            professores={professores}
            registrosMes={registrosMes}
          />
        </motion.div>

        {/* User Management */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="mb-8"
        >
          <UserManagement />
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-semibold text-slate-900">
                  Atividade recente
                </h3>
              </div>
              <p className="text-sm text-slate-500 mb-6">
                Últimas marcações de ponto
              </p>

              {atividadeRecente.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">
                  Nenhuma atividade registrada
                </div>
              ) : (
                <div className="space-y-2">
                  {atividadeRecente.map((registro) => {
                    const status = getStatus(registro);
                    const statusConfig = STATUS_CONFIG[status];
                    return (
                      <div
                        key={registro.id}
                        className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">
                            {registro.professor_nome || "Professor"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {registro.data}
                            {registro.ajustado_por && " • ajustado"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          {registro.entrada && (
                            <span className="tabular-nums">
                              {formatarHora(registro.entrada)}
                            </span>
                          )}
                          {registro.saida && (
                            <span className="tabular-nums">
                              → {formatarHora(registro.saida)}
                            </span>
                          )}
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.badge}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}
                          />
                          {statusConfig.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
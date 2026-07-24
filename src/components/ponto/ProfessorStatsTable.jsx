import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { calcularMinutosTrabalhados, formatarHoras, getStatus, STATUS_CONFIG } from "@/lib/pontoUtils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { User, Clock, TrendingUp, LogIn, Coffee, LogOut, DoorOpen } from "lucide-react";

export default function ProfessorStatsTable({ professores, registrosMes }) {
  const getStats = (profId) => {
    const regs = registrosMes.filter((r) => r.professor_id === profId);
    const totalMin = regs.reduce(
      (acc, r) => acc + calcularMinutosTrabalhados(r),
      0
    );
    const dias = regs.filter((r) => r.entrada).length;
    const ultimo = regs
      .filter((r) => r.entrada)
      .sort((a, b) => new Date(b.entrada) - new Date(a.entrada))[0];
    return {
      totalMin,
      dias,
      ultimoReg: ultimo,
      totalRegs: regs.length,
    };
  };

  if (professores.length === 0) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="p-12 text-center">
          <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Nenhum professor cadastrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-md">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left p-4 text-xs font-medium text-slate-500">Professor</th>
                <th className="text-center p-4 text-xs font-medium text-slate-500">Dias</th>
                <th className="text-center p-4 text-xs font-medium text-slate-500">Registros</th>
                <th className="text-right p-4 text-xs font-medium text-slate-500">Horas totais</th>
                <th className="text-right p-4 text-xs font-medium text-slate-500 hidden md:table-cell">Última atividade</th>
              </tr>
            </thead>
            <tbody>
              {professores.map((prof) => {
                const stats = getStats(prof.id);
                const status = stats.ultimoReg ? getStatus(stats.ultimoReg) : "fora";
                const statusConfig = STATUS_CONFIG[status];

                return (
                  <tr key={prof.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {prof.foto_url ? (
                            <img src={prof.foto_url} alt={prof.nome} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-4 h-4 text-slate-300" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate">{prof.nome}</p>
                          {prof.disciplina && (
                            <p className="text-xs text-slate-400 truncate">{prof.disciplina}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-center p-4">
                      <span className="font-semibold text-slate-900">{stats.dias}</span>
                    </td>
                    <td className="text-center p-4">
                      <span className="text-slate-600">{stats.totalRegs}</span>
                    </td>
                    <td className="text-right p-4">
                      <span className="font-bold text-emerald-700 tabular-nums">
                        {formatarHoras(stats.totalMin)}
                      </span>
                    </td>
                    <td className="text-right p-4 hidden md:table-cell">
                      {stats.ultimoReg ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-sm text-slate-500">
                            {format(parseISO(stats.ultimoReg.data), "dd/MM", { locale: ptBR })}
                          </span>
                          <Badge className={`${statusConfig.badge} border-0 text-xs`}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
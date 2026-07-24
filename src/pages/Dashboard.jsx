import React, { useState, useEffect, useCallback } from "react";
import { RegistroPonto } from "@/entities/RegistroPonto";
import { Professor } from "@/entities/Professor";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Camera,
  Clock,
  Users,
  Coffee,
  DoorOpen,
  ScanFace,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  formatarHora,
  getDataHoje,
  formatarHoras,
  calcularMinutosTrabalhados,
  getStatus,
  STATUS_CONFIG,
} from "@/lib/pontoUtils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import FaceIdModal from "@/components/ponto/FaceIdModal";

export default function Dashboard() {
  const [agora, setAgora] = useState(new Date());
  const [registrosHoje, setRegistrosHoje] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [faceIdOpen, setFaceIdOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadRegistros();
    loadProfessores();
  }, []);

  const loadRegistros = useCallback(async () => {
    setIsLoading(true);
    try {
      const hoje = getDataHoje();
      const registros = await RegistroPonto.filter({ data: hoje });
      registros.sort((a, b) => {
        if (!a.entrada) return 1;
        if (!b.entrada) return -1;
        return new Date(a.entrada) - new Date(b.entrada);
      });
      setRegistrosHoje(registros);
    } catch (error) {
      console.error("Erro ao carregar registros:", error);
    }
    setIsLoading(false);
  }, []);

  const loadProfessores = async () => {
    try {
      const data = await Professor.filter({ ativo: true });
      setProfessores(data);
    } catch (error) {
      console.error("Erro ao carregar professores:", error);
    }
  };

  const handleFaceIdSuccess = () => {
    setTimeout(() => {
      loadRegistros();
    }, 500);
  };

  const presentes = registrosHoje.filter((r) => r.entrada).length;
  const emPausa = registrosHoje.filter(
    (r) => r.saida_almoco && !r.retorno_almoco
  ).length;
  const encerrados = registrosHoje.filter((r) => r.saida).length;
  const comFoto = professores.filter((p) => p.foto_url).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/50 p-4 lg:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900">
            {format(agora, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {comFoto} professor{comFoto !== 1 ? "es" : ""} com Face ID
            habilitado
          </p>
        </motion.div>

        {/* Live Clock */}
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
                <div className="flex flex-col items-center lg:items-end gap-3">
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {presentes} presente{presentes !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Face ID Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            onClick={() => setFaceIdOpen(true)}
            className="w-full h-16 text-lg font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
          >
            <ScanFace className="w-6 h-6 mr-3" />
            Bater Ponto por Face ID
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{presentes}</p>
              <p className="text-xs text-slate-500">Presentes</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Coffee className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{emPausa}</p>
              <p className="text-xs text-slate-500">Em pausa</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <DoorOpen className="w-5 h-5 text-slate-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{encerrados}</p>
              <p className="text-xs text-slate-500">Encerrados</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Today's Activity */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                Atividade de hoje
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                {isLoading
                  ? "Carregando..."
                  : registrosHoje.length === 0
                  ? "Nenhuma batida registrada ainda"
                  : `${registrosHoje.length} registro${
                      registrosHoje.length !== 1 ? "s" : ""
                    } hoje`}
              </p>

              {registrosHoje.length === 0 ? (
                <div className="py-8 text-center">
                  <Camera className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">
                    Clique em "Bater Ponto por Face ID" para começar
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence>
                    {registrosHoje.map((registro, index) => {
                      const status = getStatus(registro);
                      const statusConfig = STATUS_CONFIG[status];
                      const minutos = calcularMinutosTrabalhados(
                        registro,
                        agora
                      );
                      const prof = professores.find(
                        (p) => p.id === registro.professor_id
                      );

                      return (
                        <motion.div
                          key={registro.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0"
                        >
                          <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {prof?.foto_url ? (
                              <img
                                src={prof.foto_url}
                                alt={registro.professor_nome}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Users className="w-5 h-5 text-slate-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 truncate">
                              {registro.professor_nome || "Professor"}
                            </p>
                            <p className="text-xs text-slate-500">
                              Entrada: {formatarHora(registro.entrada)}
                              {minutos > 0 &&
                                ` • ${formatarHoras(minutos)}`}
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.badge}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}
                            />
                            {statusConfig.label}
                          </span>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <FaceIdModal
        open={faceIdOpen}
        onClose={() => setFaceIdOpen(false)}
        onSuccess={handleFaceIdSuccess}
      />
    </div>
  );
}
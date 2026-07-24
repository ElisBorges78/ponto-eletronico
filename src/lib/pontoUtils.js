import { format, parseISO, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatarHora(isoString) {
  if (!isoString) return "--:--";
  try {
    return format(parseISO(isoString), "HH:mm");
  } catch {
    return "--:--";
  }
}

export function formatarData(isoString) {
  if (!isoString) return "";
  try {
    return format(parseISO(isoString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch {
    return "";
  }
}

export function formatarDataCurta(dataStr) {
  if (!dataStr) return "";
  try {
    return format(parseISO(dataStr), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return "";
  }
}

export function getDiaSemana(dataStr) {
  if (!dataStr) return "";
  try {
    const dia = format(parseISO(dataStr), "EEEE", { locale: ptBR });
    return dia.charAt(0).toUpperCase() + dia.slice(1);
  } catch {
    return "";
  }
}

export function getDataHoje() {
  return format(new Date(), "yyyy-MM-dd");
}

export function calcularMinutosTrabalhados(registro, agora = new Date()) {
  if (!registro || !registro.entrada) return 0;

  const entrada = parseISO(registro.entrada);
  const saidaAlmoco = registro.saida_almoco ? parseISO(registro.saida_almoco) : null;
  const retornoAlmoco = registro.retorno_almoco ? parseISO(registro.retorno_almoco) : null;
  const saida = registro.saida ? parseISO(registro.saida) : null;

  let totalMinutos = 0;

  if (saidaAlmoco) {
    totalMinutos += differenceInMinutes(saidaAlmoco, entrada);
  } else {
    totalMinutos += differenceInMinutes(agora, entrada);
  }

  if (retornoAlmoco) {
    if (saida) {
      totalMinutos += differenceInMinutes(saida, retornoAlmoco);
    } else {
      totalMinutos += differenceInMinutes(agora, retornoAlmoco);
    }
  }

  return Math.max(0, totalMinutos);
}

export function calcularMinutosPausa(registro, agora = new Date()) {
  if (!registro || !registro.saida_almoco) return 0;
  const saidaAlmoco = parseISO(registro.saida_almoco);
  const retornoAlmoco = registro.retorno_almoco ? parseISO(registro.retorno_almoco) : agora;
  return Math.max(0, differenceInMinutes(retornoAlmoco, saidaAlmoco));
}

export function formatarHoras(minutos) {
  const h = Math.floor(minutos / 60);
  const m = Math.round(minutos % 60);
  return `${h}h ${m.toString().padStart(2, "0")}min`;
}

export function formatarHorasDecimal(minutos) {
  return (minutos / 60).toFixed(1).replace(".", ",") + "h";
}

export function getStatus(registro) {
  if (!registro || !registro.entrada) return "fora";
  if (registro.saida) return "fechado";
  if (registro.saida_almoco && !registro.retorno_almoco) return "pausa";
  return "trabalhando";
}

export const STATUS_CONFIG = {
  fora: { label: "Fora do expediente", badge: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
  trabalhando: { label: "Trabalhando", badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  pausa: { label: "Em pausa", badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  fechado: { label: "Expediente encerrado", badge: "bg-slate-100 text-slate-600", dot: "bg-slate-500" },
};

export function getProximaAcao(registro) {
  if (!registro || !registro.entrada) return "entrada";
  if (registro.saida) return "nenhuma";
  if (!registro.saida_almoco) return "saida_almoco";
  if (!registro.retorno_almoco) return "retorno_almoco";
  return "saida";
}

export function getSaudacao() {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

function parseHoraMinutos(horaStr) {
  if (!horaStr) return null;
  const parts = horaStr.split(":");
  if (parts.length !== 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

export function verificarRestricaoHorario(config, acao) {
  if (!config || !config.restricoes_ativas) return { permitido: true };

  if (acao === "saida_almoco" || acao === "retorno_almoco") {
    return { permitido: true };
  }

  const agora = new Date();
  const minutosAtuais = agora.getHours() * 60 + agora.getMinutes();

  if (acao === "entrada") {
    const min = parseHoraMinutos(config.hora_min_entrada);
    const max = parseHoraMinutos(config.hora_max_entrada);
    if (min !== null && minutosAtuais < min) {
      return {
        permitido: false,
        mensagem: `Entrada permitida apenas a partir de ${config.hora_min_entrada}.`,
      };
    }
    if (max !== null && minutosAtuais > max) {
      return {
        permitido: false,
        mensagem: `Entrada permitida apenas até ${config.hora_max_entrada}.`,
      };
    }
  }

  if (acao === "saida") {
    const min = parseHoraMinutos(config.hora_min_saida);
    const max = parseHoraMinutos(config.hora_max_saida);
    if (min !== null && minutosAtuais < min) {
      return {
        permitido: false,
        mensagem: `Saída permitida apenas a partir de ${config.hora_min_saida}.`,
      };
    }
    if (max !== null && minutosAtuais > max) {
      return {
        permitido: false,
        mensagem: `Saída permitida apenas até ${config.hora_max_saida}.`,
      };
    }
  }

  return { permitido: true };
}
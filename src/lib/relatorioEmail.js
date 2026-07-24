import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  calcularMinutosTrabalhados,
  formatarHoras,
  formatarHora,
} from "@/lib/pontoUtils";

export function gerarRelatorioHTML(registros, hoje) {
  const porProfessor = {};
  registros.forEach((r) => {
    const nome = r.professor_nome || "Sem professor";
    if (!porProfessor[nome]) porProfessor[nome] = [];
    porProfessor[nome].push(r);
  });

  const nomeMes = format(hoje, "MMMM 'de' yyyy", { locale: ptBR });

  let html = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #059669; margin-bottom: 5px;">Relatório de Ponto - ${nomeMes}</h1>
      <p style="color: #666; margin-bottom: 30px;">Gerado em ${format(
        hoje,
        "dd/MM/yyyy 'às' HH:mm",
        { locale: ptBR }
      )}</p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
          <tr style="background: #f0fdf4;">
            <th style="padding: 10px; text-align: left; border: 1px solid #ddd; color: #059669;">Professor</th>
            <th style="padding: 10px; text-align: center; border: 1px solid #ddd; color: #059669;">Dias</th>
            <th style="padding: 10px; text-align: right; border: 1px solid #ddd; color: #059669;">Horas Total</th>
          </tr>
        </thead>
        <tbody>
  `;

  Object.entries(porProfessor).forEach(([nome, regs], i) => {
    const totalMin = regs.reduce(
      (acc, r) => acc + calcularMinutosTrabalhados(r),
      0
    );
    const bg = i % 2 === 0 ? "#ffffff" : "#f9fafb";
    html += `
      <tr style="background: ${bg};">
        <td style="padding: 8px 10px; border: 1px solid #ddd;">${nome}</td>
        <td style="padding: 8px 10px; border: 1px solid #ddd; text-align: center;">${regs.length}</td>
        <td style="padding: 8px 10px; border: 1px solid #ddd; text-align: right; font-weight: bold;">${formatarHoras(
          totalMin
        )}</td>
      </tr>
    `;
  });

  const totalGeral = registros.reduce(
    (acc, r) => acc + calcularMinutosTrabalhados(r),
    0
  );
  html += `
      <tr style="background: #f0fdf4; font-weight: bold;">
        <td style="padding: 10px; border: 1px solid #ddd;">TOTAL GERAL</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${registros.length}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${formatarHoras(
          totalGeral
        )}</td>
      </tr>
    </tbody>
  </table>
  `;

  html += `<h2 style="color: #059669; margin-top: 30px;">Detalhamento por Professor</h2>`;
  Object.entries(porProfessor).forEach(([nome, regs]) => {
    const totalMin = regs.reduce(
      (acc, r) => acc + calcularMinutosTrabalhados(r),
      0
    );
    html += `
      <h3 style="color: #333; margin-top: 20px;">${nome} - ${formatarHoras(
      totalMin
    )}</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background: #f8fafc;">
            <th style="padding: 8px; text-align: left; border: 1px solid #ddd; font-size: 12px;">Data</th>
            <th style="padding: 8px; text-align: center; border: 1px solid #ddd; font-size: 12px;">Entrada</th>
            <th style="padding: 8px; text-align: center; border: 1px solid #ddd; font-size: 12px;">Almoço</th>
            <th style="padding: 8px; text-align: center; border: 1px solid #ddd; font-size: 12px;">Retorno</th>
            <th style="padding: 8px; text-align: center; border: 1px solid #ddd; font-size: 12px;">Saída</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #ddd; font-size: 12px;">Horas</th>
          </tr>
        </thead>
        <tbody>
    `;
    regs.forEach((r, i) => {
      const min = calcularMinutosTrabalhados(r);
      const bg = i % 2 === 0 ? "#ffffff" : "#f9fafb";
      const dataFormatada = r.data
        ? format(parseISO(r.data), "dd/MM", { locale: ptBR })
        : "—";
      html += `
        <tr style="background: ${bg};">
          <td style="padding: 6px 8px; border: 1px solid #ddd; font-size: 12px;">${dataFormatada}</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: center; font-size: 12px;">${formatarHora(
            r.entrada
          )}</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: center; font-size: 12px;">${formatarHora(
            r.saida_almoco
          )}</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: center; font-size: 12px;">${formatarHora(
            r.retorno_almoco
          )}</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: center; font-size: 12px;">${formatarHora(
            r.saida
          )}</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: right; font-size: 12px;">${formatarHoras(
            min
          )}</td>
        </tr>
      `;
    });
    html += `</tbody></table>`;
  });

  html += `</div>`;
  return { html, nomeMes };
}
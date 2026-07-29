import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { gerarRelatorioHTML, nomeMesAno } from '../../shared/relatorioUtils.ts';
import { getGmailSenderEmail, sendGmailEmail } from '../../shared/gmailUtils.ts';
import { authorizeAdminOrWorkflow } from '../../shared/authGuard.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const auth = await authorizeAdminOrWorkflow(base44);
    if (!auth.allowed) return auth.response;
    const isWorkflowCall = auth.isWorkflowCall;

    // Determine the reference month: previous month (default), or from request body.
    const now = new Date();
    let dataRef = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    let body = {};
    try {
      body = await req.json();
      if (body.ano && body.mes) {
        dataRef = new Date(body.ano, body.mes - 1, 1);
      }
    } catch {
      // No JSON body (e.g. workflow invocation) — use default previous month.
    }

    const ano = dataRef.getFullYear();
    const mes = dataRef.getMonth(); // 0-indexed
    const mesStr = `${ano}-${(mes + 1).toString().padStart(2, '0')}`;

    // Fetch all RegistroPonto records for the target month (service role bypasses RLS).
    const todosRegistros = await base44.asServiceRole.entities.RegistroPonto.list('-data', 1000);
    const registrosMes = todosRegistros.filter((r) => {
      if (!r.data) return false;
      const parts = r.data.split('-');
      return parts[0] === ano.toString() && parts[1] === (mes + 1).toString().padStart(2, '0');
    });

    // Fetch professors for richer data.
    const professores = await base44.asServiceRole.entities.Professor.list();

    // Get users to send the report to: admins and gestores (geral, pedagógico, administrativo).
    const usuarios = await base44.asServiceRole.entities.User.list();
    const destinatarios = [
      ...new Set(
        usuarios
          .filter((u) => u.email && (u.role === 'admin' || u.tipo_gestor))
          .map((u) => u.email)
      ),
    ];

    if (destinatarios.length === 0) {
      return Response.json({ error: 'Nenhum gestor ou administrador encontrado para receber o relatório' }, { status: 400 });
    }

    // Generate the report HTML.
    const { html, nomeMes } = gerarRelatorioHTML(registrosMes, dataRef);

    // Get the Gmail OAuth access token (SHARED connector — builder's account).
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const senderEmail = await getGmailSenderEmail(accessToken);

    // Build and send the MIME message to each admin.
    const subject = `Relatório de Ponto - ${nomeMes}`;
    const results = [];

    for (const destinatario of destinatarios) {
      const result = await sendGmailEmail(accessToken, 'Ponto Eletrônico', senderEmail, destinatario, subject, html);
      results.push({ destinatario, ...result });
    }

    return Response.json({
      success: true,
      mes: mesStr,
      nomeMes,
      totalRegistros: registrosMes.length,
      totalProfessores: professores.length,
      enviados: results,
      workflow: isWorkflowCall,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
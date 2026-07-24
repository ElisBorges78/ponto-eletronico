import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getGmailSenderEmail, sendGmailEmail } from '../../shared/gmailUtils.ts';

function getTodayDateString(timezone: string): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let isWorkflowCall = false;
    try {
      const user = await base44.auth.me();
      if (user && user.role !== 'admin') {
        return Response.json(
          { error: 'Forbidden: admin access required' },
          { status: 403 }
        );
      }
      if (!user) isWorkflowCall = true;
    } catch {
      isWorkflowCall = true;
    }

    const hoje = getTodayDateString('America/Sao_Paulo');

    const professores = await base44.asServiceRole.entities.Professor.list();
    const professoresAtivos = professores.filter(
      (p) => p.ativo !== false && p.email
    );

    if (professoresAtivos.length === 0) {
      return Response.json({
        message: 'Nenhum professor ativo encontrado',
        data: hoje,
        workflow: isWorkflowCall,
      });
    }

    const registrosHoje = await base44.asServiceRole.entities.RegistroPonto.filter(
      { data: hoje }
    );

    const comRegistro = new Set(
      registrosHoje.map((r) => r.professor_id).filter(Boolean)
    );
    const semRegistro = professoresAtivos.filter((p) => !comRegistro.has(p.id));

    if (semRegistro.length === 0) {
      return Response.json({
        message: 'Todos os professores registraram o ponto hoje',
        data: hoje,
        totalProfessores: professoresAtivos.length,
        workflow: isWorkflowCall,
      });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection(
      'gmail'
    );
    const senderEmail = await getGmailSenderEmail(accessToken);

    const subject = 'Lembrete: registre seu ponto de hoje';
    const results = [];

    for (const professor of semRegistro) {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <div style="background: #059669; padding: 16px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 20px;">Ponto Eletrônico</h1>
          </div>
          <div style="background: white; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px; padding: 24px;">
            <p style="color: #1e293b; font-size: 16px;">Olá, <strong>${professor.nome}</strong>!</p>
            <p style="color: #475569; font-size: 15px; line-height: 1.6;">
              Notamos que você ainda não registrou seu ponto hoje (<strong>${hoje}</strong>).
            </p>
            <p style="color: #475569; font-size: 15px; line-height: 1.6;">
              Acesse o sistema e registre seu horário para manter seu controle de ponto em dia.
            </p>
            <div style="text-align: center; margin-top: 24px;">
              <span style="background: #059669; color: white; padding: 12px 28px; border-radius: 8px; font-weight: 600; display: inline-block;">
                Acesse o sistema para registrar
              </span>
            </div>
          </div>
        </div>
      `;

      const result = await sendGmailEmail(
        accessToken,
        'Ponto Eletrônico',
        senderEmail,
        professor.email,
        subject,
        html
      );
      results.push({
        professor: professor.nome,
        email: professor.email,
        ...result,
      });
    }

    return Response.json({
      success: true,
      data: hoje,
      totalProfessores: professoresAtivos.length,
      totalSemRegistro: semRegistro.length,
      notificacoes: results,
      workflow: isWorkflowCall,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
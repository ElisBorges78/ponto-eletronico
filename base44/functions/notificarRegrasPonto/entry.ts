import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getGmailSenderEmail, sendGmailEmail } from '../../shared/gmailUtils.ts';

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

    const body = await req.json().catch(() => ({}));
    const configId = body.config_id;

    let config = null;
    if (configId) {
      config = await base44.asServiceRole.entities.Configuracao.get(configId);
    } else {
      const configs = await base44.asServiceRole.entities.Configuracao.list();
      config = configs[0] || null;
    }

    if (!config) {
      return Response.json(
        { error: 'Configuração não encontrada' },
        { status: 404 }
      );
    }

    const professores = await base44.asServiceRole.entities.Professor.list();
    const professoresAtivos = professores.filter(
      (p) => p.ativo !== false && p.email
    );

    if (professoresAtivos.length === 0) {
      return Response.json({
        message: 'Nenhum professor ativo com email encontrado',
        workflow: isWorkflowCall,
      });
    }

    const { accessToken } =
      await base44.asServiceRole.connectors.getConnection('gmail');
    const senderEmail = await getGmailSenderEmail(accessToken);

    const subject = 'Atualização das regras de registro de ponto';

    const horarioInfo =
      config.hora_abertura && config.hora_fechamento
        ? `<p style="color: #475569; font-size: 15px; line-height: 1.6;">
             Horário permitido para registro: <strong>${config.hora_abertura}</strong> às <strong>${config.hora_fechamento}</strong>
           </p>`
        : '';

    const regrasInfo = config.regras_descricao
      ? `<div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0;">
           <p style="color: #166534; font-size: 14px; margin: 0; line-height: 1.6; white-space: pre-line;">${config.regras_descricao}</p>
         </div>`
      : '';

    const results = [];

    for (const professor of professoresAtivos) {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <div style="background: #059669; padding: 16px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 20px;">Ponto Eletrônico</h1>
          </div>
          <div style="background: white; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px; padding: 24px;">
            <p style="color: #1e293b; font-size: 16px;">Olá, <strong>${professor.nome}</strong>!</p>
            <p style="color: #475569; font-size: 15px; line-height: 1.6;">
              As regras de registro de ponto foram atualizadas no sistema.
            </p>
            ${horarioInfo}
            ${regrasInfo}
            <p style="color: #475569; font-size: 15px; line-height: 1.6;">
              Certifique-se de seguir as novas diretrizes ao registrar seu ponto.
            </p>
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
      totalNotificados: professoresAtivos.length,
      notificacoes: results,
      workflow: isWorkflowCall,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
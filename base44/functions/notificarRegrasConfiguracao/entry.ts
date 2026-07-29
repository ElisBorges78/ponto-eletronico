import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getGmailSenderEmail, sendGmailEmail } from '../../shared/gmailUtils.ts';
import { authorizeAdminOrWorkflow } from '../../shared/authGuard.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const auth = await authorizeAdminOrWorkflow(base44);
    if (!auth.allowed) return auth.response;
    const isWorkflowCall = auth.isWorkflowCall;

    const configs = await base44.asServiceRole.entities.Configuracao.list();
    if (configs.length === 0) {
      return Response.json({
        message: 'Nenhuma configuração encontrada',
        workflow: isWorkflowCall,
      });
    }
    const config = configs[0];

    const professores = await base44.asServiceRole.entities.Professor.list();
    const destinatarios = professores.filter(
      (p) => p.ativo !== false && p.email
    );

    if (destinatarios.length === 0) {
      return Response.json({
        message: 'Nenhum professor ativo com email encontrado',
        workflow: isWorkflowCall,
      });
    }

    const { accessToken } =
      await base44.asServiceRole.connectors.getConnection('gmail');
    const senderEmail = await getGmailSenderEmail(accessToken);

    const subject = 'Atualização das Regras de Registro de Ponto';

    const restricoes: string[] = [];
    if (config.restricoes_ativas) {
      if (config.hora_min_entrada && config.hora_max_entrada) {
        restricoes.push(
          `<li>Entrada permitida: <strong>${config.hora_min_entrada}</strong> às <strong>${config.hora_max_entrada}</strong></li>`
        );
      }
      if (config.hora_min_saida && config.hora_max_saida) {
        restricoes.push(
          `<li>Saída permitida: <strong>${config.hora_min_saida}</strong> às <strong>${config.hora_max_saida}</strong></li>`
        );
      }
    }

    const mensagemCustom = config.mensagem_regras || '';
    const restricoesHtml =
      restricoes.length > 0
        ? `<ul style="color: #475569; font-size: 15px; line-height: 1.8; padding-left: 20px;">${restricoes.join('')}</ul>`
        : '<p style="color: #475569; font-size: 15px;">Nenhuma restrição de horário ativa no momento.</p>';

    const results = [];
    for (const professor of destinatarios) {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <div style="background: #059669; padding: 16px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 20px;">Ponto Eletrônico</h1>
          </div>
          <div style="background: white; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px; padding: 24px;">
            <p style="color: #1e293b; font-size: 16px;">Olá, <strong>${professor.nome}</strong>!</p>
            <p style="color: #475569; font-size: 15px; line-height: 1.6;">
              As regras de registro de ponto foram atualizadas. Confira as novas diretrizes:
            </p>
            ${restricoesHtml}
            ${
              mensagemCustom
                ? `<div style="background: #f0fdf4; border-left: 3px solid #059669; padding: 12px 16px; margin: 16px 0; border-radius: 0 8px 8px 0;"><p style="color: #1e293b; font-size: 14px; margin: 0;">${mensagemCustom}</p></div>`
                : ''
            }
            <p style="color: #475569; font-size: 14px; margin-top: 16px;">Em caso de dúvidas, entre em contato com a administração.</p>
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
      totalNotificados: results.length,
      notificacoes: results,
      workflow: isWorkflowCall,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
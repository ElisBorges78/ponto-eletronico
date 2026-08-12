import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getGmailSenderEmail, sendGmailEmail } from '../../shared/gmailUtils.ts';
import { authorizeAdminOrWorkflow } from '../../shared/authGuard.ts';
import { escapeHtml } from '../../shared/relatorioUtils.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const auth = await authorizeAdminOrWorkflow(base44);
    if (!auth.allowed) return auth.response;

    let body = {};
    try {
      body = await req.json();
    } catch {
      // No JSON body — ignore.
    }
    const professorId = body.professor_id || body.professorId;
    if (!professorId) {
      return Response.json({ error: 'professor_id é obrigatório' }, { status: 400 });
    }

    const professor = await base44.asServiceRole.entities.Professor.get(professorId);
    if (!professor) {
      return Response.json({ error: 'Professor não encontrado' }, { status: 404 });
    }

    // Destinatários: administradores e gestores.
    const usuarios = await base44.asServiceRole.entities.User.list();
    const destinatarios = [
      ...new Set(
        usuarios
          .filter((u) => u.email && (u.role === 'admin' || u.tipo_gestor))
          .map((u) => u.email)
      ),
    ];

    if (destinatarios.length === 0) {
      return Response.json({ error: 'Nenhum gestor ou administrador encontrado' }, { status: 400 });
    }

    const nome = escapeHtml(professor.nome || 'Novo professor');
    const email = escapeHtml(professor.email || '—');
    const disciplina = escapeHtml(professor.disciplina || '—');
    const unidade = escapeHtml(professor.unidade || '—');
    const matricula = escapeHtml(professor.matricula || '—');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f59e0b; color: white; padding: 20px; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">⏰ Novo Cadastro Pendente</h1>
          <p style="margin: 5px 0 0; opacity: 0.95;">Um novo professor foi cadastrado e aguarda aprovação.</p>
        </div>
        <div style="background: #fff; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 12px 12px; padding: 24px;">
          <h2 style="color: #1e293b; margin-top: 0;">${nome}</h2>
          <table style="width: 100%; font-size: 14px; color: #475569; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #94a3b8; width: 120px;">E-mail</td><td>${email}</td></tr>
            <tr><td style="padding: 6px 0; color: #94a3b8;">Disciplina</td><td>${disciplina}</td></tr>
            <tr><td style="padding: 6px 0; color: #94a3b8;">Unidade</td><td>${unidade}</td></tr>
            <tr><td style="padding: 6px 0; color: #94a3b8;">Matrícula</td><td>${matricula}</td></tr>
          </table>
          <p style="margin-top: 24px; color: #475569; font-size: 14px;">
            Acesse a página <strong>Professores</strong> no sistema para aprovar ou rejeitar este cadastro.
          </p>
        </div>
      </div>`;

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const senderEmail = await getGmailSenderEmail(accessToken);
    const subject = `Novo cadastro pendente: ${(professor.nome || 'Novo professor').replace(/[\r\n]/g, ' ')}`;
    const results = [];

    for (const destinatario of destinatarios) {
      const result = await sendGmailEmail(
        accessToken,
        'Ponto Eletrônico',
        senderEmail,
        destinatario,
        subject,
        html
      );
      results.push({ destinatario, ...result });
    }

    return Response.json({ success: true, enviados: results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
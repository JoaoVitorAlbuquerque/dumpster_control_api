import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Resend } from 'resend';
import { buildRequestEmail } from 'src/shared/emails/build-request-email';

// import * as nodemailer from 'nodemailer';
@Processor('mail')
export class MailProcessor extends WorkerHost {
  private resend = new Resend(process.env.RESEND_API_KEY);

  // private transporter = nodemailer.createTransport({
  //   host: process.env.SMTP_HOST,
  //   port: Number(process.env.SMTP_PORT),
  //   secure: Number(process.env.SMTP_PORT) === 465,
  //   auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  // });

  async process(job: Job) {
    const from = process.env.EMAIL_FROM;

    console.log('MAIL JOB:', job.name, job.data.to);

    if (job.name === 'password-reset') {
      const { to, name, link } = job.data;
      await this.resend.emails.send({
        from,
        to,
        subject: 'Redefinição de senha',
        html: `
          <p>Olá, ${name}.</p>
          <p>Para redefinir sua senha, clique no link abaixo (válido por 15 minutos):</p>
          <p><a href="${link}">${link}</a></p>
          <p>Se você não solicitou, ignore este e-mail.</p>
        `,
      });
    }

    if (job.name === 'welcome') {
      const { to, name } = job.data;
      await this.resend.emails.send({
        from,
        to,
        subject: 'Bem-vindo',
        html: `<p>Olá, ${name}! Sua conta foi criada com sucesso.</p>`,
      });
    }

    if (job.name === 'new-request') {
      const { to, name, protocol, activity, rules } = job.data;

      const html = buildRequestEmail({
        name,
        protocol,
        activity,
        rules,
        statusUrl: `${process.env.FRONT_URL}/consult-protocol`,
      });

      await this.resend.emails.send({
        from,
        to,
        subject: `Solicitação registrada - Protocolo ${protocol}`,
        html,
      });
    }

    if (job.name === 'alert-abuse-request') {
      const { alertReasons } = job.data;
      await this.resend.emails.send({
        from,
        to: from, // to Modificar para destinatário real quando definido
        subject: '⚠️ ALERTA: Abuso de Solicitação de Caçamba',
        html: `
          <h2>Alerta Automático de Fiscalização</h2>
          <p>O sistema detectou uma nova solicitação que ultrapassa os limites anuais permitidos:</p>
          <ul>
            ${alertReasons.map((r) => `<li>${r}</li>`).join('')}
          </ul>
          <p>Por favor, acesse o painel administrativo para avaliar se a solicitação deve ser aprovada, cancelada ou se uma multa deve ser emitida.</p>
        `,
      });
    }

    console.log(`Email job "${job.name}" processed for ${job.data.to}`);

    return { ok: true };
  }
}

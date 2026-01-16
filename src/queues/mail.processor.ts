import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import * as nodemailer from 'nodemailer';

@Processor('mail')
export class MailProcessor extends WorkerHost {
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  async process(job: Job) {
    const from = process.env.SMTP_FROM;

    console.log('MAIL JOB:', job.name, job.data.to);

    if (job.name === 'password-reset') {
      const { to, name, link } = job.data;
      await this.transporter.sendMail({
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
      await this.transporter.sendMail({
        from,
        to,
        subject: 'Bem-vindo',
        html: `<p>Olá, ${name}! Sua conta foi criada com sucesso.</p>`,
      });
    }

    console.log(`Email job "${job.name}" processed for ${job.data.to}`);

    return { ok: true };
  }
}

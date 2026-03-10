export function buildRequestEmail({
  name,
  protocol,
  activity,
  rules,
  statusUrl,
}: {
  name: string;
  protocol: string;
  activity: string;
  rules: string[];
  statusUrl: string;
}) {
  const rulesHtml = rules
    .map((rule) => `<li style="margin-bottom:6px;">${rule}</li>`)
    .join('');

  return `
  <!DOCTYPE html>
  <html>
  <head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Solicitação registrada</title>
  </head>

  <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
  <tr>
  <td align="center">

  <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;padding:40px;">

  <!-- LOGO -->
  <tr>
  <td align="center" style="padding-bottom:20px;">
  <img 
  src="${process.env.LOGO_URL}"
  width="120"
  alt="Prefeitura"
  />
  </td>
  </tr>

  <!-- TÍTULO -->
  <tr>
  <td align="center" style="padding-bottom:10px;">
  <h2 style="margin:0;color:#111;font-size:22px;">
  Solicitação registrada com sucesso
  </h2>
  </td>
  </tr>

  <tr>
  <td style="color:#444;font-size:14px;line-height:22px;">
  Olá <strong>${name}</strong>,
  <br/><br/>
  Recebemos sua solicitação e ela foi registrada em nosso sistema.
  </td>
  </tr>

  <!-- CARD PROTOCOLO -->
  <tr>
  <td style="padding-top:25px;">

  <table width="100%" cellpadding="0" cellspacing="0" style="
  background:#f1f5f9;
  border-radius:8px;
  text-align:center;
  padding:20px;
  ">

  <tr>
  <td style="font-size:12px;color:#666;">
  PROTOCOLO
  </td>
  </tr>

  <tr>
  <td style="font-size:22px;font-weight:bold;letter-spacing:2px;">
  ${protocol}
  </td>
  </tr>

  <tr>
  <td style="font-size:14px;padding-top:6px;">
  Atividade: <strong>${activity === 'CLEANING' ? 'Limpeza' : activity === 'TREE' ? 'Árvores' : activity === 'CONSTRUCTION' ? 'Construção' : activity === 'GROUND' ? 'Terra' : 'Outro'}</strong>
  </td>
  </tr>

  </table>

  </td>
  </tr>

  <!-- BOTÃO -->
  <tr>
  <td align="center" style="padding-top:30px;">

  <a 
  href="${statusUrl}"
  style="
  background:#2563eb;
  color:#ffffff;
  text-decoration:none;
  padding:12px 22px;
  border-radius:6px;
  font-size:14px;
  display:inline-block;
  "
  >
  Consultar status da solicitação
  </a>

  </td>
  </tr>

  <!-- DIVIDER -->
  <tr>
  <td style="padding:30px 0;">
  <hr style="border:none;border-top:1px solid #e5e7eb;" />
  </td>
  </tr>

  <!-- ORIENTAÇÕES -->
  <tr>
  <td>

  <h3 style="margin:0 0 10px 0;font-size:18px;color:#111;">
  Orientações para utilização da caçamba
  </h3>

  <ul style="padding-left:18px;color:#444;font-size:14px;line-height:22px;">
  ${rulesHtml}
  </ul>

  </td>
  </tr>

  <!-- DIVIDER -->
  <tr>
  <td style="padding:30px 0;">
  <hr style="border:none;border-top:1px solid #e5e7eb;" />
  </td>
  </tr>

  <!-- ALERTA -->
  <tr>
  <td style="padding-top:15px;">

  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
  <tr>
  <td style="
  background:#FFF4E5;
  border-left:4px solid #F5A623;
  padding:14px;
  font-family:Arial, Helvetica, sans-serif;
  ">

  <p style="margin:0 0 8px 0;font-size:15px;font-weight:bold;color:#B54708;">
  ⚠️ Atenção!
  </p>

  <p style="margin:0 0 10px 0;font-size:14px;color:#444;line-height:22px;">
  Não é permitido o descarte de materiais como: 
  <strong>papelão, plástico, roupas, calçados, tecidos, latas, vidros, arames, ferro, PVC e demais recicláveis.</strong>
  </p>

  <p style="margin:0 0 10px 0;font-size:14px;font-weight:bold;color:#C0392B;">
  NÃO PODEM TER MISTURA DE RESÍDUOS NA MESMA CAÇAMBA
  </p>

  <p style="margin:0;font-size:14px;color:#2E7D32;">
  ✅ Contamos com a colaboração de todos para manter a cidade limpa, organizada e ambientalmente responsável.
  </p>

  </td>
  </tr>
  </table>

  </td>
  </tr>

  <!-- FOOTER -->
  <tr>
  <td style="padding-top:30px;text-align:center;font-size:12px;color:#777;">

  Prefeitura Municipal • Sistema de Solicitações Urbanas
  <br/><br/>
  Este é um e-mail automático. Não responda esta mensagem.

  </td>
  </tr>

  </table>

  </td>
  </tr>
  </table>

  </body>
  </html>
`;
}

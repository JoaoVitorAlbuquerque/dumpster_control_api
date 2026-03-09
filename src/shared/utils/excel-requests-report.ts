import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { AbuseReportResult } from '../../modules/requests/types/requests.types';

export async function generateExcelRequestsReport(
  data: AbuseReportResult,
  res: Response,
  year: number,
) {
  const workbook = new ExcelJS.Workbook();

  // Aba 1: Abuso por Endereço
  const sheetAddress = workbook.addWorksheet('Abuso por Endereço');
  sheetAddress.columns = [
    { header: 'Endereço Formatado', key: 'address', width: 50 },
    { header: 'Total Caçambas', key: 'total', width: 15 },
    { header: 'CPFs Solicitantes', key: 'cpfs', width: 30 },
    { header: 'Datas das Solicitações', key: 'dates', width: 40 },
  ];

  data.rankingAddress.forEach((item) => {
    sheetAddress.addRow({
      address: item.address,
      total: item.total,
      cpfs: [...new Set(item.requests.map((r) => r.cpf))].join(', '),
      dates: item.requests
        .map((r) => r.orderDate.toLocaleDateString('pt-BR'))
        .join(', '),
    });
  });

  // Aba 2: Abuso por CPF
  const sheetCpf = workbook.addWorksheet('Abuso por CPF');
  sheetCpf.columns = [
    { header: 'CPF', key: 'cpf', width: 20 },
    { header: 'Nome Solicitante', key: 'name', width: 30 },
    { header: 'Total Caçambas', key: 'total', width: 15 },
    { header: 'Endereços Utilizados', key: 'addresses', width: 60 },
  ];

  data.rankingCpf.forEach((item) => {
    sheetCpf.addRow({
      cpf: item.cpf,
      name: item.requests[0]?.account?.name || item.requests[0]?.name || 'N/A',
      total: item.total,
      addresses: [
        ...new Set(item.requests.map((r) => r.addressFormatted)),
      ].join(' | '),
    });
  });

  // Configuração dos headers para forçar o download
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=relatorio_abusos_cacambas_${year}.xlsx`,
  );

  await workbook.xlsx.write(res);
  res.end();
}

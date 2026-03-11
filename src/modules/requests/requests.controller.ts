import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Req,
  Query,
  Res,
  Header,
} from '@nestjs/common';
import { Response } from 'express';
import * as PDFDocument from 'pdfkit';
import * as path from 'path';
import * as fs from 'fs';

import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { ActiveUserId } from 'src/shared/decorators/ActiveUserId';
import { IsPublic } from 'src/shared/decorators/IsPublic';
import { Status } from './entities/Status';
import { generateExcelRequestsReport } from 'src/shared/utils/excel-requests-report';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  create(
    @ActiveUserId() userId: string,
    @Body() createRequestDto: CreateRequestDto,
    @Req() req?: any,
  ) {
    return this.requestsService.create(userId, createRequestDto, req);
  }

  @IsPublic()
  @Post('public')
  createPublic(@Body() createRequestDto: CreateRequestDto, @Req() req?: any) {
    return this.requestsService.createPublic(createRequestDto, req);
  }

  @Get()
  findAll(
    @ActiveUserId() userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: Status,
    @Query('accountId') accountId?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const parsedAccountId =
      accountId === 'null' || accountId === '' ? null : accountId;

    return this.requestsService.findAll(userId, {
      startDate,
      endDate,
      status,
      accountId: parsedAccountId,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  }

  @Get('accountId')
  findAllByUserId(@ActiveUserId() accountId: string) {
    return this.requestsService.findAllByUserId(accountId);
  }

  @IsPublic()
  @Get(':protocol/protocol')
  findByProtocol(@Param('protocol') protocolCode: string) {
    return this.requestsService.findByProtocol(protocolCode);
  }

  @Get('status/requested')
  findAllByStatusRequested() {
    return this.requestsService.findAllByStatusRequested();
  }

  @Get('user/requests')
  findAllRequestsByUser() {
    return this.requestsService.findAllRequestsByUser();
  }

  @Get('map/delivered')
  findDeliveredForMap() {
    return this.requestsService.findDeliveredForMap();
  }

  @Get('analytics')
  findAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('bucket') bucket: 'day' | 'week' | 'month' = 'day',
  ) {
    return this.requestsService.getAnalytics({ startDate, endDate, bucket });
  }

  @Get('abuse')
  async getAbuseReportData(@Query('year') queryYear?: string) {
    const year = queryYear ? parseInt(queryYear, 10) : new Date().getFullYear();
    return await this.requestsService.getAbuseReport(year);
  }

  @Get('abuse/export')
  async exportAbuseReport(
    @Res() res: Response,
    @Query('year') queryYear?: string,
  ) {
    const year = queryYear ? parseInt(queryYear, 10) : new Date().getFullYear();

    // Busca os dados através do serviço
    const reportData = await this.requestsService.getAbuseReport(year);

    // Delega a montagem e envio para o utilitário
    await generateExcelRequestsReport(reportData, res, year);
  }

  @Get('approved/pdf')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="vehicles.pdf"')
  async generateApprovedRequestsPdf(@Res() res: Response) {
    const approvedRequests = await this.requestsService.listApprovedRequests();

    // 1. Inicializa o documento com "bufferPages" para permitir a paginação no final
    const doc = new PDFDocument({
      layout: 'landscape',
      size: 'A4',
      margin: 40,
      bufferPages: true,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=relatorio-cacambas.pdf',
    );

    doc.pipe(res);

    // 2. Configurações de Medidas da Tabela
    // Largura A4 Paisagem ~841.89. Com 40 de margem de cada lado: 841.89 - 80 = 761.89
    const usableWidth = 761;
    let y = 40; // Posição vertical atual do cursor

    // Ajustado proporcionalmente para somar 761 exatos!
    const columns = [
      { label: 'ENDEREÇO', width: 200, key: 'address' },
      { label: 'NOME', width: 140, key: 'name' },
      { label: 'CONTATO', width: 100, key: 'contact' },
      { label: 'FINALIDADE', width: 120, key: 'activity' },
      { label: 'OBSERVAÇÃO', width: 201, key: 'observation' },
    ];

    /*
  ==========================
  FUNÇÕES DE DESENHO (REUTILIZÁVEIS)
  ==========================
  */

    const drawDocumentHeader = () => {
      const logoPath = path.resolve('src/assets/logo-moreira_sales.png');

      // Verifica se a logo existe antes de desenhar para não dar crash
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 40, 20, { width: 60 });
      }

      doc
        .fillColor('#111827')
        .font('Helvetica-Bold')
        .fontSize(16)
        .text('Prefeitura Municipal', 115, 25);

      doc
        .fillColor('#6b7280')
        .font('Helvetica')
        .fontSize(12)
        .text(
          'Relatório de Solicitações de Caçambas Aprovadas - Pedidos do dia',
          115,
          45,
        );

      doc
        .fontSize(10)
        .text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 40, 25, {
          align: 'right',
          width: usableWidth,
        });

      y = 100; // Define onde a tabela vai começar
    };

    const drawTableHeader = () => {
      let x = 40;

      // Fundo do cabeçalho da tabela (Cinza escuro moderno)
      doc.rect(x, y, usableWidth, 24).fill('#1f2937');

      doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff');

      columns.forEach((col) => {
        doc.text(col.label, x + 5, y + 7, {
          width: col.width - 10,
          align: 'left',
        });
        x += col.width;
      });

      y += 24;
    };

    /*
  ==========================
  CONSTRUÇÃO DO DOCUMENTO
  ==========================
  */

    drawDocumentHeader();
    drawTableHeader();

    // Desenha as Linhas
    approvedRequests.forEach((req, index) => {
      let x = 40;

      const rowValues = [
        req.addressFormatted || '-',
        req.name || '-',
        req.contact || '-',
        req.activity === 'TREE'
          ? 'Árvore'
          : req.activity === 'CONSTRUCTION'
            ? 'Construção'
            : req.activity === 'GROUND'
              ? 'Terra'
              : req.activity === 'CLEANING'
                ? 'Limpeza'
                : '-',
        req.priority === 'HIGH'
          ? `[URGENTE] ${req.description || ''}`.trim()
          : req.description || '-',
      ];

      // 1. Calcula qual será a altura desta linha específica (baseado no maior texto)
      doc.font('Helvetica').fontSize(9);
      let rowHeight = 0;

      columns.forEach((col, i) => {
        const h = doc.heightOfString(rowValues[i], { width: col.width - 10 });
        if (h > rowHeight) rowHeight = h;
      });

      const padding = 12;
      rowHeight += padding; // Adiciona um respiro em cima e embaixo

      // 2. Verifica se a linha cabe na página atual. Se não, quebra a página.
      if (y + rowHeight > doc.page.height - 50) {
        doc.addPage();
        y = 40;
        drawTableHeader();
        doc.font('Helvetica').fontSize(9);
      }

      // 3. Efeito Zebrado Suave
      if (index % 2 === 0) {
        doc.rect(x, y, usableWidth, rowHeight).fill('#f9fafb');
      }

      doc.fillColor('#374151'); // Cor do texto (Cinza escuro, mais suave que o preto puro)

      // 4. Preenche os dados
      columns.forEach((col, i) => {
        doc.text(rowValues[i], x + 5, y + padding / 2, {
          width: col.width - 10,
          align: 'left',
        });
        x += col.width;
      });

      // 5. Linha divisória inferior sútil
      doc
        .moveTo(40, y + rowHeight)
        .lineTo(40 + usableWidth, y + rowHeight)
        .lineWidth(0.5)
        .strokeColor('#e5e7eb')
        .stroke();

      y += rowHeight;
    });

    /*
  ==========================
  TOTAL
  ==========================
  */

    // Se o rodapé for ficar espremido no final, joga pra próxima página
    if (y + 40 > doc.page.height - 50) {
      doc.addPage();
      y = 40;
    }

    y += 15;
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#111827')
      .text(
        `Total de solicitações aprovadas: ${approvedRequests.length}`,
        40,
        y,
      );

    /*
  ==========================
  PAGINAÇÃO (Só funciona bem com bufferPages: true)
  ==========================
  */

    const pages = doc.bufferedPageRange();

    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#9ca3af')
        .text(
          `Página ${i + 1} de ${pages.count}`,
          40, // X
          doc.page.height - 30, // Y
          { align: 'center', width: usableWidth },
        );
    }

    doc.end();
  }

  @Patch(':requestId')
  update(
    @ActiveUserId() accountId: string,
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Body() updateRequestDto: UpdateRequestDto,
    @Req() req?: any,
  ) {
    return this.requestsService.update(
      accountId,
      requestId,
      updateRequestDto,
      req,
    );
  }

  @Patch(':requestId/soft-delete')
  softDelete(
    @ActiveUserId() accountId: string,
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Req() req?: any,
  ) {
    return this.requestsService.softDelete(accountId, requestId, req);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.requestsService.remove(+id);
  }
}

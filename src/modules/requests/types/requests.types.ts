import { Request } from '@prisma/client';

export type RequestWithAccount = Request & {
  account: { name: string; email: string } | null;
};

export interface CpfRankingItem {
  cpf: string;
  total: number;
  requests: RequestWithAccount[];
}

export interface AddressRankingItem {
  address: string;
  total: number;
  requests: RequestWithAccount[];
}

export interface AbuseReportResult {
  rankingCpf: CpfRankingItem[];
  rankingAddress: AddressRankingItem[];
}

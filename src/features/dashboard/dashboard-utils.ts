import type { Denuncia } from '@/src/types';

export interface DashboardStats {
  total: number;
  pendentes: number;
  confirmadas: number;
  rejeitadas: number;
}

export interface TrendPoint {
  key: string;
  label: string;
  total: number;
}

export interface BairroRanking {
  nome: string;
  total: number;
}

export interface Prioridade {
  id: string;
  bairro: string;
  tempo: string;
}

export const INITIAL_STATS: DashboardStats = {
  total: 0,
  pendentes: 0,
  confirmadas: 0,
  rejeitadas: 0,
};

export const PERIOD_OPTIONS = [
  { label: '7 dias', days: 7 },
  { label: '30 dias', days: 30 },
  { label: '90 dias', days: 90 },
  { label: 'Tudo', days: null },
] as const;

export function criarEvolucao(denuncias: Denuncia[], periodo: number | null): TrendPoint[] {
  const limite =
    periodo === null ? null : new Date(Date.now() - periodo * 24 * 60 * 60 * 1000);
  const porDia = new Map<string, number>();

  denuncias.forEach((denuncia) => {
    if (limite && denuncia.dataCriacao < limite) return;

    const data = denuncia.dataCriacao;
    const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(
      data.getDate()
    ).padStart(2, '0')}`;
    porDia.set(chave, (porDia.get(chave) ?? 0) + 1);
  });

  return [...porDia.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, total]) => ({
      key,
      total,
      label: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(
        new Date(`${key}T12:00:00`)
      ),
    }));
}

export function evolucaoMaximo(evolucao: TrendPoint[]) {
  return Math.max(...evolucao.map(({ total }) => total), 1);
}

export function criarRankingBairros(denuncias: Denuncia[]): BairroRanking[] {
  const totais = new Map<string, number>();
  denuncias.forEach(({ bairro }) => totais.set(bairro, (totais.get(bairro) ?? 0) + 1));

  return [...totais.entries()]
    .map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome))
    .slice(0, 5);
}

export function criarPrioridades(denuncias: Denuncia[]): Prioridade[] {
  return [...denuncias]
    .filter(({ statusDenuncia }) => statusDenuncia === 'pendente')
    .sort((a, b) => a.dataCriacao.getTime() - b.dataCriacao.getTime())
    .slice(0, 3)
    .map(({ id, bairro, dataCriacao }) => ({
      id,
      bairro,
      tempo: tempoDeEspera(dataCriacao),
    }));
}

function tempoDeEspera(data: Date): string {
  const dias = Math.max(0, Math.floor((Date.now() - data.getTime()) / 86_400_000));
  return dias === 0 ? 'Recebida hoje' : `Aguardando há ${dias} ${dias === 1 ? 'dia' : 'dias'}`;
}

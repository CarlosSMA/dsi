import { areaDoBairro, findBairro } from '@/constants/map';
import { RECIFE_BAIRROS } from '@/constants/recife-bairros';
import { RECIFE_MICRORREGIOES } from '@/constants/recife-microrregioes';
import type { Denuncia } from '@/src/types';

// Score de priorização: indica em quais distritos (as 6 RPAs do Recife) a Vigilância Ambiental deve agir primeiro.
//
// Cada denúncia soma pontos ao distrito onde fica:
// - confirmada nos últimos 30 dias: foco do mosquito confirmado, é o sinal mais forte;
// - pendente: suspeita ainda não avaliada; vale mais quando está esperando há muitos dias;
// - rejeitada: não soma.
// Os pontos viram um risco de 0 a 100 numa curva que cresce rápido no começo e se aproxima de 100 aos poucos,
// para que poucos casos já apareçam e muitos casos não estourem a escala.

export const PESOS = {
  confirmadaRecente: 3,
  pendente: 1,
  pendenteAtrasada: 2,
};

export const DIAS_CONFIRMADA_RECENTE = 30;
export const DIAS_PENDENTE_ATRASADA = 7;
// Com 10 pontos o distrito chega a 63% de risco; com 20, a 86%.
export const PONTOS_ESCALA = 10;

export const LIMITE_RISCO_ALTO = 70;
export const LIMITE_RISCO_MEDIO = 40;

export type NivelRisco = 'alto' | 'medio' | 'baixo';

// Cores de cada nível de risco no score de priorização.
export const NIVEL_CORES: Record<NivelRisco, { cor: string; texto: string; fundo: string; rotulo: string }> = {
  alto: { cor: '#DC2626', texto: '#B91C1C', fundo: '#FEE2E2', rotulo: 'Alta' },
  medio: { cor: '#60A5FA', texto: '#2563EB', fundo: '#DBEAFE', rotulo: 'Média' },
  baixo: { cor: '#10B981', texto: '#059669', fundo: '#D1FAE5', rotulo: 'Baixa' },
};

export interface DistritoScore {
  rpa: string;
  nome: string;
  zona: string;
  confirmadasRecentes: number;
  pendentes: number;
  pendentesAtrasadas: number;
  pontos: number;
  risco: number;
  nivel: NivelRisco;
}

export interface ScorePriorizacao {
  geral: number;
  nivelGeral: NivelRisco;
  distritos: DistritoScore[];
  totalConsideradas: number;
}

const DISTRITOS = [
  { rpa: '1', nome: 'Distrito I', zona: 'Centro' },
  { rpa: '2', nome: 'Distrito II', zona: 'Zona Norte' },
  { rpa: '3', nome: 'Distrito III', zona: 'Zona Noroeste' },
  { rpa: '4', nome: 'Distrito IV', zona: 'Zona Oeste' },
  { rpa: '5', nome: 'Distrito V', zona: 'Zona Sudoeste' },
  { rpa: '6', nome: 'Distrito VI', zona: 'Zona Sul' },
];

const DIA_MS = 24 * 60 * 60 * 1000;

const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

const BAIRRO_POR_NOME = new Map(RECIFE_BAIRROS.map((bairro) => [normalizar(bairro.nome), bairro]));

// Usa a localização da denúncia; se ela cair fora dos bairros mapeados, tenta pelo nome do bairro informado.
function bairroDaDenuncia(denuncia: Denuncia) {
  return findBairro(denuncia.localizacao) ?? BAIRRO_POR_NOME.get(normalizar(denuncia.bairro));
}

// A microrregião do bairro começa pelo número da RPA (ex.: "3.1" fica na RPA 3).
function rpaDaDenuncia(denuncia: Denuncia): string | undefined {
  return bairroDaDenuncia(denuncia)?.micro.split('.')[0];
}

type TipoContagem = 'confirmadasRecentes' | 'pendentes' | 'pendentesAtrasadas';

// Em qual contagem a denúncia entra; undefined quando ela não soma pontos.
function tipoDaDenuncia(denuncia: Denuncia, agora: number): TipoContagem | undefined {
  const dias = (agora - denuncia.dataCriacao.getTime()) / DIA_MS;

  if (denuncia.statusDenuncia === 'confirmada') {
    return dias <= DIAS_CONFIRMADA_RECENTE ? 'confirmadasRecentes' : undefined;
  }
  if (denuncia.statusDenuncia === 'pendente') {
    return dias > DIAS_PENDENTE_ATRASADA ? 'pendentesAtrasadas' : 'pendentes';
  }
  return undefined;
}

export function pontosDoDistrito(contagem: Record<TipoContagem, number>): number {
  return (
    contagem.confirmadasRecentes * PESOS.confirmadaRecente +
    contagem.pendentes * PESOS.pendente +
    contagem.pendentesAtrasadas * PESOS.pendenteAtrasada
  );
}

export function nivelDoRisco(risco: number): NivelRisco {
  if (risco >= LIMITE_RISCO_ALTO) return 'alto';
  if (risco >= LIMITE_RISCO_MEDIO) return 'medio';
  return 'baixo';
}

const riscoDosPontos = (pontos: number) => Math.round(100 * (1 - Math.exp(-pontos / PONTOS_ESCALA)));

export function calcularScorePriorizacao(denuncias: Denuncia[], agora = Date.now()): ScorePriorizacao {
  const contagemPorRpa = new Map(
    DISTRITOS.map(({ rpa }) => [rpa, { confirmadasRecentes: 0, pendentes: 0, pendentesAtrasadas: 0 }])
  );
  let totalConsideradas = 0;

  for (const denuncia of denuncias) {
    const contagem = contagemPorRpa.get(rpaDaDenuncia(denuncia) ?? '');
    const tipo = tipoDaDenuncia(denuncia, agora);
    if (!contagem || !tipo) continue;

    totalConsideradas += 1;
    contagem[tipo] += 1;
  }

  const distritos = DISTRITOS.map((distrito) => {
    const contagem = contagemPorRpa.get(distrito.rpa)!;
    const pontos = pontosDoDistrito(contagem);
    const risco = riscoDosPontos(pontos);
    return { ...distrito, ...contagem, pontos, risco, nivel: nivelDoRisco(risco) };
  }).sort((a, b) => b.risco - a.risco || a.rpa.localeCompare(b.rpa));

  // Score geral: média dos seis distritos, para refletir a situação da cidade inteira.
  const geral = Math.round(distritos.reduce((soma, { risco }) => soma + risco, 0) / distritos.length);

  return { geral, nivelGeral: nivelDoRisco(geral), distritos, totalConsideradas };
}

export interface RiscoMapa {
  // Nível de cada uma das 12 regiões do mapa, pelo código da região.
  areas: Map<string, NivelRisco>;
  // Nível de cada bairro com pelo menos uma denúncia não rejeitada, pelo nome do bairro.
  bairros: Map<string, NivelRisco>;
}

const contagemVazia = () => ({ confirmadasRecentes: 0, pendentes: 0, pendentesAtrasadas: 0 });
const nivelDaContagem = (contagem: Record<TipoContagem, number>) =>
  nivelDoRisco(riscoDosPontos(pontosDoDistrito(contagem)));

/**
 * Risco das regiões e dos bairros no mapa, com a mesma fórmula e os mesmos pesos do score dos distritos.
 */
export function calcularRiscoMapa(denuncias: Denuncia[], agora = Date.now()): RiscoMapa {
  const porArea = new Map(RECIFE_MICRORREGIOES.map(({ codigo }) => [codigo, contagemVazia()]));
  const porBairro = new Map<string, Record<TipoContagem, number>>();

  for (const denuncia of denuncias) {
    const bairro = bairroDaDenuncia(denuncia);
    if (!bairro || denuncia.statusDenuncia === 'rejeitada') continue;

    if (!porBairro.has(bairro.nome)) porBairro.set(bairro.nome, contagemVazia());
    const tipo = tipoDaDenuncia(denuncia, agora);
    if (!tipo) continue;

    porBairro.get(bairro.nome)![tipo] += 1;
    const area = porArea.get(areaDoBairro(bairro.nome) ?? '');
    if (area) area[tipo] += 1;
  }

  return {
    areas: new Map([...porArea].map(([codigo, contagem]) => [codigo, nivelDaContagem(contagem)])),
    bairros: new Map([...porBairro].map(([nome, contagem]) => [nome, nivelDaContagem(contagem)])),
  };
}

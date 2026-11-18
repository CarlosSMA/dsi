import { findBairro } from '@/constants/map';
import { RECIFE_BAIRROS } from '@/constants/recife-bairros';
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

const DIAS_CONFIRMADA_RECENTE = 30;
const DIAS_PENDENTE_ATRASADA = 7;
// Com 10 pontos o distrito chega a 63% de risco; com 20, a 86%.
const PONTOS_ESCALA = 10;

export const LIMITE_RISCO_ALTO = 70;
export const LIMITE_RISCO_MEDIO = 40;

export type NivelRisco = 'alto' | 'medio' | 'baixo';

export interface DistritoScore {
  rpa: string;
  nome: string;
  zona: string;
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

// A microrregião do bairro começa pelo número da RPA (ex.: "3.1" fica na RPA 3).
const RPA_POR_BAIRRO = new Map(RECIFE_BAIRROS.map((bairro) => [normalizar(bairro.nome), bairro.micro.split('.')[0]]));

// Usa a localização da denúncia; se ela cair fora dos bairros mapeados, tenta pelo nome do bairro informado.
function rpaDaDenuncia(denuncia: Denuncia): string | undefined {
  const bairro = findBairro(denuncia.localizacao);
  if (bairro) {
    return bairro.micro.split('.')[0];
  }
  return RPA_POR_BAIRRO.get(normalizar(denuncia.bairro));
}

function pontosDaDenuncia(denuncia: Denuncia, agora: number): number {
  const dias = (agora - denuncia.dataCriacao.getTime()) / DIA_MS;

  if (denuncia.statusDenuncia === 'confirmada') {
    return dias <= DIAS_CONFIRMADA_RECENTE ? PESOS.confirmadaRecente : 0;
  }
  if (denuncia.statusDenuncia === 'pendente') {
    return dias > DIAS_PENDENTE_ATRASADA ? PESOS.pendenteAtrasada : PESOS.pendente;
  }
  return 0;
}

export function nivelDoRisco(risco: number): NivelRisco {
  if (risco >= LIMITE_RISCO_ALTO) return 'alto';
  if (risco >= LIMITE_RISCO_MEDIO) return 'medio';
  return 'baixo';
}

const riscoDosPontos = (pontos: number) => Math.round(100 * (1 - Math.exp(-pontos / PONTOS_ESCALA)));

export function calcularScorePriorizacao(denuncias: Denuncia[], agora = Date.now()): ScorePriorizacao {
  const pontosPorRpa = new Map<string, number>();
  let totalConsideradas = 0;

  for (const denuncia of denuncias) {
    const rpa = rpaDaDenuncia(denuncia);
    const pontos = pontosDaDenuncia(denuncia, agora);
    if (!rpa || pontos === 0) continue;

    totalConsideradas += 1;
    pontosPorRpa.set(rpa, (pontosPorRpa.get(rpa) ?? 0) + pontos);
  }

  const distritos = DISTRITOS.map((distrito) => {
    const risco = riscoDosPontos(pontosPorRpa.get(distrito.rpa) ?? 0);
    return { ...distrito, risco, nivel: nivelDoRisco(risco) };
  }).sort((a, b) => b.risco - a.risco || a.rpa.localeCompare(b.rpa));

  // Score geral: média dos seis distritos, para refletir a situação da cidade inteira.
  const geral = Math.round(distritos.reduce((soma, { risco }) => soma + risco, 0) / distritos.length);

  return { geral, nivelGeral: nivelDoRisco(geral), distritos, totalConsideradas };
}

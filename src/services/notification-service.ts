import { RECIFE_BAIRROS } from '@/constants/recife-bairros';
import {
  NOTIFICACOES_DATASET,
  calcularResumoBairro,
} from '@/src/data/bairros-notificacoes-dataset';
import type {
  NotificacaoBairro,
  ResumoBairroEpidemiologico,
  CategoriaNotificacao,
} from '@/src/types';

export interface BairroOpcao {
  nome: string;
  rpa: string;
  micro: string;
  totalAlertas: number;
}

export interface EstatisticasGeraisNotificacoes {
  totalAlertas: number;
  totalBairrosComAlerta: number;
  bairrosEmRiscoAlto: number;
  mutiroesAtivos: number;
}

/**
 * Retorna as notificações por bairro, com suporte a filtro opcional.
 * Se nenhum bairro for especificado, retorna todos os alertas ordenados por data.
 */
export async function listarNotificacoes(
  filtroBairro?: string | null,
  filtroCategoria?: CategoriaNotificacao | null
): Promise<NotificacaoBairro[]> {
  let alertas = [...NOTIFICACOES_DATASET];

  if (filtroBairro && filtroBairro.trim().length > 0) {
    const termo = filtroBairro.trim().toLowerCase();
    alertas = alertas.filter((item) => item.bairro.toLowerCase() === termo);
  }

  if (filtroCategoria) {
    alertas = alertas.filter((item) => item.categoria === filtroCategoria);
  }

  // Ordena por data (mais recentes primeiro)
  return alertas.sort((a, b) => new Date(b.dataIso).getTime() - new Date(a.dataIso).getTime());
}

/**
 * Obtém o resumo de risco epidemiológico de um bairro específico.
 */
export async function obterResumoBairro(nomeBairro: string): Promise<ResumoBairroEpidemiologico> {
  return calcularResumoBairro(nomeBairro);
}

/**
 * Lista todos os 94 bairros oficiais do Recife em ordem alfabética,
 * enriquecidos com a contagem de alertas ativos e RPA.
 */
export function listarBairrosRecife(): BairroOpcao[] {
  return RECIFE_BAIRROS.map((b) => {
    const rpa = `RPA ${b.micro.split('.')[0] || '4'}`;
    const totalAlertas = NOTIFICACOES_DATASET.filter(
      (n) => n.bairro.toLowerCase() === b.nome.toLowerCase()
    ).length;

    return {
      nome: b.nome,
      rpa,
      micro: b.micro,
      totalAlertas,
    };
  }).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

/**
 * Retorna as estatísticas consolidadas para a visão geral da cidade.
 */
export function obterEstatisticasGerais(): EstatisticasGeraisNotificacoes {
  const bairrosComAlerta = new Set(NOTIFICACOES_DATASET.map((n) => n.bairro));
  const bairrosRiscoAlto = new Set(
    NOTIFICACOES_DATASET.filter((n) => n.nivelRisco === 'alto').map((n) => n.bairro)
  );
  const mutiroes = NOTIFICACOES_DATASET.filter((n) => n.categoria === 'mutirao_saude').length;

  return {
    totalAlertas: NOTIFICACOES_DATASET.length,
    totalBairrosComAlerta: bairrosComAlerta.size,
    bairrosEmRiscoAlto: bairrosRiscoAlto.size,
    mutiroesAtivos: mutiroes,
  };
}

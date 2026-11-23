import { useEffect, useMemo, useState } from 'react';

import { calcularRiscoMapa, type RiscoMapa } from '@/src/features/profile/utils/score-priorizacao';
import { DenunciaManager } from '@/src/models/Denuncia';
import type { Denuncia } from '@/src/types';

// Nível de risco das regiões e dos bairros do mapa, atualizado em tempo real conforme as denúncias mudam.
// Fica null enquanto carrega ou se as denúncias não puderem ser lidas; aí o mapa usa as cores neutras.
// Só começa a acompanhar quando `ativo` for verdadeiro (usuário logado), pois o Firestore exige login.
export function useRiscoRegioes(ativo: boolean): RiscoMapa | null {
  const [denuncias, setDenuncias] = useState<Denuncia[] | null>(null);

  useEffect(() => {
    if (!ativo) {
      return;
    }
    return DenunciaManager.observar(setDenuncias, (error) => {
      console.warn('Não foi possível carregar as denúncias para o mapa de risco.', error);
      setDenuncias(null);
    });
  }, [ativo]);

  return useMemo(() => (denuncias ? calcularRiscoMapa(denuncias) : null), [denuncias]);
}

# Notificações e Alertas Epidemiológicos por Bairro (VetorRisco)

Documentação técnica da funcionalidade de **Notificações por Bairro**, implementada no aplicativo **VetorRisco** com base no dataset epidemiológico de arboviroses (Dengue, Chikungunya e Zika) da Prefeitura do Recife.

---

## 1. Contexto e Objetivo

No combate às arboviroses urbanas no município do Recife, a transparência e agilidade na comunicação com o cidadão e com as equipes de campo são vitais. 

A tela de Notificações por Bairro (`app/notifications.tsx`) foi projetada para:
1. **Apresentar alertas dinâmicos e geolocalizados** aos cidadãos e agentes de saúde da Prefeitura do Recife.
2. **Permitir a consulta e filtragem personalizada por qualquer um dos 94 bairros oficiais do Recife** e suas respectivas RPAs (Regiões Político-Administrativas).
3. **Traduzir indicadores epidemiológicos complexos** (Índice de Infestação Predial - IIP, notificações de foco, mutirões comunitários e bloqueio vetorial) em orientações sanitárias claras e acionáveis.

---

## 2. Estrutura do Dataset Epidemiológico

O dataset (`src/data/bairros-notificacoes-dataset.ts`) reúne os dados epidemiológicos municipais em conformidade com as diretrizes da **Secretaria de Saúde do Recife (SESAU)** e do **Sinan**:

### Classificação de Risco Epidemiológico (IIP - Ministério da Saúde / OMS)
* **Risco Baixo (Satisfatório):** IIP inferior a $1{,}0\%$. Bairros em situação estável com vigilância contínua.
* **Risco Médio (Alerta):** IIP entre $1{,}0\%$ e $3{,}9\%$. Atenção redobrada e monitoramento intensificado.
* **Risco Alto (Risco de Surto):** IIP igual ou superior a $3{,}9\%$. Ações imediatas de bloqueio, eliminação mecânica de criadouros e aplicação de larvicida/fumacê.

### Categorias de Notificação
* `alerta_foco`: Registro de focos e recipientes com larvas de *Aedes aegypti*.
* `mutirao_saude`: Campanhas comunitárias e mutirões "Recife Sem Dengue" organizados pela PCR.
* `caso_confirmado`: Confirmação laboratorial ou clínica de casos no bairro.
* `orientacao_sanitaria`: Recomendações preventivas para condomínios, residências e áreas vulneráveis.
* `fumace_bloqueio`: Aplicação de Ultra Baixo Volume (UBV) veicular ou costal para bloqueio de transmissão.

---

## 3. Modelo de Dados (`src/types/index.ts`)

```typescript
export type NivelRiscoEpidemiologico = 'baixo' | 'medio' | 'alto';

export type CategoriaNotificacao =
  | 'alerta_foco'
  | 'mutirao_saude'
  | 'caso_confirmado'
  | 'orientacao_sanitaria'
  | 'fumace_bloqueio';

export interface NotificacaoBairro {
  id: string;
  bairro: string;
  rpa: string;
  micro: string;
  categoria: CategoriaNotificacao;
  nivelRisco: NivelRiscoEpidemiologico;
  titulo: string;
  descricao: string;
  meta: string;
  dataIso: string;
  recomendacao?: string;
  casosRecentes?: number;
  indiceInfestacao?: string;
  badge?: string;
}

export interface ResumoBairroEpidemiologico {
  bairro: string;
  rpa: string;
  micro: string;
  nivelRisco: NivelRiscoEpidemiologico;
  totalAlertas: number;
  casosEstimados: number;
  indiceInfestacaoPredial: number;
  temMutiraoAgendado: boolean;
  statusDescricao: string;
}
```

---

## 4. Camada de Serviços (`src/services/notification-service.ts`)

A lógica de negócios foi completamente desacoplada da interface visual:

* `listarNotificacoes(filtroBairro?, filtroCategoria?)`: Consulta os alertas epidemiológicos com filtros por bairro e categoria temática, retornando lista ordenada por recência cronológica.
* `obterResumoBairro(nomeBairro)`: Calcula o score de risco, total de alertas, estimativa de casos e o IIP específico daquele bairro ou microrregião.
* `listarBairrosRecife()`: Retorna os 94 bairros oficiais do Recife em ordem alfabética com contadores de alertas ativos para preencher o seletor modal.
* `obterEstatisticasGerais()`: Consolida métricas municipais (total de alertas, bairros em alerta alto, mutirões ativos) para a visão geral da capital.

---

## 5. Interface e Recursos Visuais (`app/notifications.tsx`)

* **Seletor Modal de Bairro com Busca em Tempo Real:** Permite ao usuário alternar entre a visão geral da capital ou selecionar qualquer bairro do Recife com contadores visuais de alertas.
* **Card Epidemiológico Dinâmico:** Exibe badge de severidade tricolor (verde, âmbar, vermelho), índice predial (IIP %), estimativa de casos recentes e avisos de mutirões agendados.
* **Filtros por Chips de Categoria:** Filtro horizontal com ícones para isolar rapidamente focos, mutirões, casos, prevenção e fumacê.
* **Badges de Prevenção e Ação:** Cada notificação traz recomendações práticas destacadas ("O que fazer"), além de data/hora relativa e identificação da RPA.
* **Controle de Leitura:** Indicador de alertas ativos, marcação individual e botão de "Marcar todas como lidas".
* **Pull-to-Refresh:** Atualização dinâmica arrastando a tela para baixo.

---

## 6. Como Testar no Expo Go

1. Inicie o bundler do Expo com cache limpo:
   ```bash
   npx expo start -c
   ```
2. Abra o app no Expo Go (Android/iOS) ou pressione `w` para abrir na versão Web.
3. Faça login no aplicativo ou acesse a rota `/notifications`.
4. Teste os seguintes fluxos:
   * **Visão Geral:** Observe o panorama de arboviroses de toda a cidade do Recife.
   * **Filtro de Bairro:** Clique em "Alterar" no seletor de localização e selecione **Várzea**, **Ibura** ou **Boa Viagem**. Observe o card epidemiológico mudar com o IIP, casos e alertas específicos.
   * **Busca no Modal:** Digite o nome de um bairro (ex: "Casa Amarela" ou "Arruda") e confirme a filtragem instantânea.
   * **Filtro por Chip:** Clique nos chips de "Focos" ou "Mutirões" e veja a lista refinar instantaneamente.
   * **Marcar como Lida:** Toque em uma notificação ou use "Marcar todas como lidas" para verificar a persistência do estado visual.

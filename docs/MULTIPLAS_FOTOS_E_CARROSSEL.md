# Múltiplas Imagens por Ocorrência, Carrossel e POO (VetorRisco)

Documentação técnica da implementação do suporte a **múltiplas fotos por denúncia**, **carrossel interativo de imagens** e estruturação de **Classes de Domínio com Programação Orientada a Objetos (POO)** no aplicativo **VetorRisco**.

---

## 1. Contexto e Atendimento aos Feedbacks de DSI

Durante a banca de avaliação da disciplina de Desenvolvimento de Sistemas de Informação (DSI), foram apontadas as seguintes melhorias para a versão final:

1. **Evidências Fotográficas Múltiplas:** Permitir que o cidadão anexe mais de uma foto ao registrar um foco de mosquito, cobrindo diferentes ângulos do criadouro (ex: visão geral, detalhe aproximado de larvas e ponto de referência da rua).
2. **Carrossel de Imagens:** Visualização fluida das fotos em formato de carrossel com paginação, gestos de deslizar (*swipe*) e modo tela cheia.
3. **Aderência aos Princípios de POO:** Estruturação de classes de domínio encapsulando regras de negócio, validação e métodos de ciclo de vida.

---

## 2. Arquitetura da Solução

### 2.1. Classe de Domínio POO (`src/models/Denuncia.ts`)

A classe `Denuncia` encapsula os dados e comportamentos da ocorrência. As operações de coleção são agrupadas em `DenunciaManager`:

```typescript
export class Denuncia implements Denuncia {
  public id: string;
  public id_denunciador: string;
  public id_revisor?: string;
  public statusDenuncia: StatusDenuncia;
  public localizacao: LocalizacaoCoords;
  public bairro: string;
  public urlFoto?: string;
  public urlsFotos: string[];
  public dataCriacao: Date;

  // Métodos de Negócio
  public get fotos(): string[];
  public get fotoPrincipal(): string | undefined;
  public get totalFotos(): number;
  public temMultiplasFotos(): boolean;
  public estaPendente(): boolean;
  public estaConfirmada(): boolean;
  public estaRejeitada(): boolean;
  public adicionarFoto(url: string): void;
  public removerFoto(index: number): boolean;
  public formatarDataCriacao(): string;
  public validar(): { valido: boolean; erros: string[] };
  public toFirestorePayload(): Record<string, unknown>;
}
```

### 2.2. Camada de Armazenamento em Lote (`src/services/photo-service.ts`)

O serviço de fotos foi enriquecido com métodos assíncronos em lote para o **Supabase Storage**:

* `uploadMultipleReportPhotos(photos, userId, reportId)`: Faz o upload paralelo de até 4 fotos para o bucket `photos`, gerando URLs assinadas de acesso seguro.
* `removeMultipleReportPhotos(paths)`: Garante a integridade transacional, removendo fotos órfãs caso ocorra falha na persistência do Firestore.

### 2.3. Persistência Híbrida e Retrocompatibilidade (`src/services/denuncia-service.ts` e `denuncias-consulta-service.ts`)

Para garantir que denúncias antigas registradas no banco não quebrem, o schema persiste tanto `urlsFotos` (array) quanto `urlFoto` (string da primeira foto):

* Denúncias novas gravam `urlsFotos: string[]` e `urlFoto: string`.
* Ao ler do Firestore, caso uma denúncia só possua `urlFoto`, ela é automaticamente normalizada para `urlsFotos: [urlFoto]`.

---

## 3. Interface e Componentes Visuais

### 3.1. Galeria de Pré-Visualização na Captura (`app/photo-report.tsx`)

* O cidadão pode alternar livremente entre **Câmera** e **Galeria** para compor a denúncia.
* Suporte a até **4 fotos** por ocorrência.
* Miniaturas com numeração (`1`, `2`, `3`, `4`) e botão de exclusão rápida (X) antes de confirmar o envio.
* Botão dinâmico indicando o total de fotos selecionadas: `"ENVIAR DENÚNCIA (X FOTOS)"`.

### 3.2. Componente de Carrossel Reutilizável (`components/image-carousel.tsx`)

Componente modular de carrossel de imagens com:
* **Navegação por Gesto (*Swipe*):** Deslize horizontal fluido com `pagingEnabled`.
* **Badge Contador:** Indicador no canto superior direito (`1/3`, `2/3`, `3/3`).
* **Bolinhas de Paginação (*Dots*):** Indicadores visuais animados na base da foto.
* **Setas de Navegação:** Botões de avanço e retorno para suporte web e acessibilidade.
* **Modo Tela Cheia (*Fullscreen Viewer*):** Toque na foto para abrir visualizador ampliado com fundo escuro.

### 3.3. Integração na Lista de Denúncias (`src/features/denuncias/DenunciaListItem.tsx`)

* **No Card da Lista:** Exibe miniatura de capa com badge `📷 X fotos` caso haja múltiplas fotos.
* **No Modal de Detalhes / Revisão:** Apresenta o carrossel completo de fotos para os agentes da Prefeitura e para o cidadão, permitindo inspecionar todos os ângulos do foco antes de confirmar ou descartar.

---

## 4. Guia de Teste e Demonstração

1. Inicie a aplicação com o Metro Bundler:
   ```bash
   npx expo start -c
   ```
2. Abra o app no **Expo Go** ou Web (`w`).
3. **Fluxo do Cidadão (Registro com Múltiplas Fotos):**
   * Clique no botão central de câmera na Home ou vá em Nova Ocorrência.
   * Tire uma foto com a câmera e adicione uma segunda foto pela galeria.
   * Observe as miniaturas com o botão de excluir e o contador "2 de 4 fotos".
   * Clique em "ENVIAR DENÚNCIA (2 FOTOS)".
4. **Fluxo de Visualização (Carrossel):**
   * Vá em **Perfil > Minhas denúncias** (ou no Painel da Prefeitura).
   * Localize a denúncia recém-criada com o badge de múltiplas fotos.
   * Clique na foto ou em "Ver fotos" para abrir o modal com o carrossel e deslize entre as fotos.

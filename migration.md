# Plano de Migração para LangChain (pdf2course)

Este documento detalha o plano arquitetural para migrar a implementação atual da API generativa (nativa `@google/genai`) para o ecossistema LangChain. A atual implementação no backend (`server/services/gemini/*`) trata geração de IA (estruturação e conteúdos JSON), fluxos RAG (Retrieval-Augmented Generation) e processamento em lote para requisições de embeddings.

---

## 1. Contexto Atual vs. Benefícios do LangChain

### Cenário Atual (Vantagens e Limitações)
- **Framework Utilizado:** SDK Oficial `@google/genai` com requisições HTTP nativas.
- **Requisições de Embeddings (`embedChunks.ts`):** Lógica customizada de `retries` com *exponential backoff* devido aos limites de taxa (429 Rate Limit) e redução da dimensionalidade (*Matryoshka representation* para 768 dims).
- **Geração JSON (`generateCourseStructure.ts`, `generateLessonContent.ts`):** Tratada estritamente via `responseMimeType: 'application/json'`. Instruções elaboradas incluídas diretamente num grande bloco de "Prompt" em formato Template String e parsing do retorno via `JSON.parse` seguido do schema Zod.

### Por que LangChain?
1. **Redução de Código Boilerplate:** LangChain embutirá a lógica de tentativa/erros (retries).
2. **`withStructuredOutput`:** Elimina a necessidade de descrever a estrutura do JSON e as regras de *formatting* nas instruções do prompt principal. O LangChain passará transparentemente seu schema do formato `z.object` (Zod) atual sob o formato de *Function Calling* / Parâmetros API para o Gemini, resultando em respostas mais robustas e economia de tokens.
3. **Gerenciamento Elegante de Prompts (`PromptTemplate`):** Permite isolar os templates e variáveis (ex: `language`, `contextChunks`), deixando o pipeline de preenchimento dos dados mais modular e organizado, diferente das funções gigantes de *build prompt* atuais.
4. **Isolamento e Abstração RAG (`MultiQueryRetriever`):** O `generateLessonContent.ts` executa várias queries para melhorar a busca (RAG), concatenando deduplicatas. O LangChain traz o `MultiQueryRetriever` e o `SupabaseVectorStore`, os quais consolidam e abstraem todo esse complexo de busca.

---

## 2. Passo a Passo da Migração

### Etapa 1: Refatoração do Cliente e Embeddings (`embedChunks.ts` & `geminiClient.ts`)

**Objetivo:** Substituir as configurações repetitivas e funções de *retry* isoladas.

- **Antes:** Custom `withRetry` em `embedBatch`.
- **Depois:** Utilizar a classe `GoogleGenerativeAIEmbeddings`.

### Etapa 2: Migração de Geração de Conteúdo Estruturado

Isto se aplica principalmente de `generateCourseStructure.ts` e `generateLessonContent.ts`.

**Objetivo:** Remover as macros extensas ensinando o formato JSON ao Gemini e fazer bind dos *Schemas* de uma maneira nativa através da feature de Structured Output do Langchain.

### Etapa 3: Abstração do fluxo Supabase RAG (Opcional, porém recomendada)

Em `generateLessonContent.ts` (linhas 67~108), há fragmentos que quebram `key_topics` + `learning_objectives` em múltiplas buscas e iteram o embedding para recuperar via repositório.
**Caminho com LangChain:**
- Instanciar a classe `@langchain/community/vectorstores/supabase` `SupabaseVectorStore`.
- Utilizar os `retrievers` providos.
Se seu código usa RPC direta otimizada do PostgreSQL (`semanticSearchChunks`), mantê-lo apenas injetando o novo `embedder` é perfeitamente válido como passo 1 sem abraçar a classe SupabaseStore do Langchain imediatamente.

---

## 3. Riscos Constatados e Cuidados

1. **Output Dimensionality:** O modelo `gemini-embedding-001` nativamente solta 3072 dims mas você está truncando (*Matryoshka representation*) configurando `outputDimensionality: 768` no builder SDK original limit. O pacote Langchain `@langchain/google-genai` pode não ter um mapeamento explícito `TaskType/dimensionality` direto na classe. Neste caso, faça o `truncate` array manual da saída (ex: `v.slice(0, 768)`). Certifique-se para não quebrar a coluna correspondente no Supabase de 768 dims!
2. **Tokens Excessivos vs Function Calling:** `withStructuredOutput()` converte Zod para sintaxe OpenAPI Function Schema em baixo nível para a Google. Essa conversão é otimizada e estritamente tipada. Recomenda-se adicionar `description` nas propriedades dos campos no schema interno `z.string().describe("...")` em Zod para ajudar o modelo Gemini a entender as chaves via function arguments, garantindo maior fidelidade ao conteúdo.
3. **Remoção de Rate Limit Warnings Customizados:** O LangChain roda os re-tries silenciosamente a não ser explícito. O log de erro customizado na console para as requisições que estouram quota vai evaporar em prol do gerenciamento invisível do SDK caso não coloque `callbacks` do Langchain para rastrear `retries`.

---
## Conclusão do Plano
A migração pode ser completada rapidamente já que toda a base com **verificação Zod forte já existe**. A recompensa será prompts absurdamente reduzidos, delegação do erro e um código voltado à pipeline (Chain) muito mais fácil de isolar e realizar Unit Test usando LLMs "fakes" providos pelo utilitário do LangChain.

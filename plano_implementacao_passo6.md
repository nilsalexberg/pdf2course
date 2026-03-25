# Plano de Implementação: Passo 6 - Geração da Estrutura do Curso

## 1. Visão Geral

O Passo 6 do processo de geração do curso (`processCourseGeneration.ts`) é responsável por orquestrar a transição do status do curso para `'generating_structure'`, compilar o prompt com o contexto necessário e obter a estrutura final (módulos e aulas) através do Gemini 2.5 Flash.

De acordo com os requisitos e para dar suporte ao uso de RAG (Retrieval-Augmented Generation) posterior, o retorno do formato da aula não pode ser simplista (apenas um título). A IA que construirá o curso precisa de dados ricos na aula para buscar os trechos corretos (chunks) no banco de dados vetorial e, posteriormente, gerar o conteúdo textual da aula e os exercícios.

## 2. Estrutura do Retorno do Gemini (Schema JSON)

Para garantir o melhor resultado, definiremos uma estrutura JSON rica que o Gemini deve seguir rigorosamente.

### Schema Proposto (Zod / JSON Schema):

```json
{
  "modules": [
    {
      "module_number": 1,
      "title": "Título do Módulo",
      "description": "Breve descrição do que este módulo cobre e como ele se conecta ao todo",
      "lessons": [
        {
          "lesson_number": 1,
          "title": "Título da Aula",
          "description": "Resumo rápido do escopo desta aula específica",
          "learning_objectives": [
            "Objetivo de aprendizado 1 (ex: Compreender o conceito X)",
            "Objetivo de aprendizado 2 (ex: Saber calcular Y)"
          ],
          "key_topics": [
            "Tópico chave A",
            "Tópico chave B"
          ],
          "rag_search_queries": [
            "Termos específicos ou perguntas para a busca semântica no banco vetorial sobre o Tópico A",
            "Termos específicos ou perguntas para a busca semântica no banco vetorial sobre o Tópico B"
          ]
        }
      ]
    }
  ]
}
```

### Por que esse formato de Aula?
*   **`learning_objectives` & `key_topics`**: Guiarão o prompt de geração de conteúdo focado na aula, garantindo que a IA não divague e atenda as expectativas traçadas no planejamento estrutural.
*   **`rag_search_queries`**: Quando formos de fato gerar a aula de número `X`, usaremos essas strings para fazer buscas diretas (`similarity search`) nos embeddings dos PDFs (gerados no passo 4). Como o Gemini tem toda a visão dos "Sumários" agora (Passo 6), ele é o mais qualificado para formular exatamente *o que buscar* para aquela aula, maximizando a precisão do RAG.

## 3. Montagem do Prompt

O Prompt para o Gemini 2.5 Flash deverá agrupar:
1.  **Dados Básicos do Curso**: `title` e `description` preenchidos pelo usuário.
2.  **Configurações Exigidas**: `num_modules` e `lessons_per_module` vindos do banco de dados (que também dita o formato estrito da saída JSON).
3.  **Contexto dos Documentos (Sumários Consolidados do Passo 5)**:
    Incluiremos diretamente o JSON resumido de cada documento, que contém os dados essenciais para o planejamento: `core_themes`, `estimated_target_difficulty`, `target_audience` e a `structural_outline`.

*Estratégia do Prompt*: Informar explicitamente no prompt de sistema que ele é um "Designer Instrucional Sênior" e que deve agrupar os sumários para criar uma jornada consistente com a quantidade exata de módulos e aulas.

## 4. Validação da Resposta (Zod Validation)

A etapa de validação é de suma importância. Um modelo de linguagem (LLM) pode falhar no formato, então devemos:
1.  **Exigir JSON**: Configurar no SDK do Gemini (`responseMimeType: "application/json"`).
2.  **Parse Seguro com Zod**:
    Criar um schema `courseStructureSchema` com Zod para validar `JSON.parse(response)`.
3.  **Validação de Regras de Negócio**:
    *   Verificar se `parsedData.modules.length === course.num_modules`.
    *   Verificar se para todo módulo iterado, `module.lessons.length === course.lessons_per_module`.
    *   *Nota*: Podem ocorrer pequenos desvios do LLM. O processo deve ter regras de fallback ou retry automatizado caso as métricas estruturais não correspondam às configurações do usuário.

## 5. Passo a Passo do Fluxo no Código

1.  **Atualizar o Status**: Alterar na tabela `courses` o campo `status` para `'generating_structure'`.
2.  **Preparação de Dados**: Buscar do BD as configurações do curso (módulos, aulas por módulo) e os `document_summaries` do Passo 5.
3.  **Requisição ao Gemini**:
    *   Envia os sumários como texto formatado.
    *   Solicita o schema JSON estritamente tipado (via prompt e Zod).
4.  **Parse & Validação**:
    *   `Zod` valida a estrutura.
    *   Throw ou fallback automático em caso de falha de parsing.
5.  **Persistência (Salvar a Estrutura no BD)**:
    *   Criar um loop ou transação para inserir na tabela de `modules`.
    *   Para cada `module`, inserir na tabela `lessons` os dados da aula.
    *   Criticamente importante (segundo o PRD): Salvar as aulas com status inicial de `'not_generated'`, pois a geração de conteúdo em si (o texto final, RAG, quizzes) é posterior.
    *   Armazenar `learning_objectives`, `key_topics` e `rag_search_queries` em metadados/jsonb ou colunas dedicadas das aulas para resgate futuro.
6.  **Conclusão**: O script passa a bola para o passo final, que é colocar o curso em status `'ready'` ou seguir a lógica definida pela orquestração.

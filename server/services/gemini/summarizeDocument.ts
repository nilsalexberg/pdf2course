import type { DocumentSummary } from '../../../types/course'
import { getGeminiClient } from './geminiClient'

const SUMMARIZE_MODEL = 'gemini-2.5-flash'

const SYSTEM_PROMPT = `Você é um designer instrucional sênior com experiência em mapear a ementa de materiais didáticos.
Abaixo está o texto bruto e completo extraído de um documento/PDF.

A sua tarefa é LER O DOCUMENTO INTEIRO E GERAR UM MAPEAMENTO ESTRUTURAL DE CONHECIMENTO altamente granular e detalhado.

MUITO IMPORTANTE:
1. NÃO faça um resumo descritivo/textual do conteúdo (narrativas, introduções e definições textuais devem ser descartadas). O conteúdo denso desse PDF será consultado separadamente via RAG depois.
2. Seu único objetivo agora é CRIAR A TAXONOMIA COMPLETA DOS ASSUNTOS para que essa lista de "objetivos de aprendizado e tópicos" oriente a criação da ementa do curso na próxima etapa.
3. Seja EXTREMAMENTE GRANULAR. Não junte muitos conceitos num único tópico no "structural_outline", divida em quantos tópicos forem necessários para abranger 100% da profundidade do arquivo de forma separada.
4. Você deve gerar a resposta ÚNICA E EXCLUSIVAMENTE em formato JSON, seguindo estritamente a estrutura abaixo, sem marcação markdown além das permitidas para código.

ESTRUTURA JSON DESEJADA:
{
  "document_title": "Nome sugerido para este documento",
  "core_themes": ["Tema central 1", "Tema central 2"],
  "estimated_target_difficulty": "Beginner, Intermediate ou Advanced",
  "target_audience": "Breve descrição do público que leria isso",
  "structural_outline": [
    {
      "topic_title": "Tema do bloco",
      "key_concepts": ["Conceito A", "Conceito B", "Termo Técnico C"],
      "learning_objectives": ["Ser capaz de calcular X", "Entender quando aplicar Y"]
    }
  ]
}

Texto bruto do arquivo para analisar:
===================================
`

/**
 * Sends the full extracted text of a PDF to Gemini and returns a structured
 * DocumentSummary (knowledge taxonomy) suitable for course structure generation.
 */
export async function summarizeDocument(extractedText: string): Promise<DocumentSummary> {
  const ai = getGeminiClient()

  const response = await ai.models.generateContent({
    model: SUMMARIZE_MODEL,
    contents: `${SYSTEM_PROMPT}${extractedText}\n===================================`,
    config: {
      responseMimeType: 'application/json',
    },
  })

  const raw = response.text
  if (!raw) {
    throw new Error('Gemini returned an empty response for document summarization')
  }

  return JSON.parse(raw) as DocumentSummary
}

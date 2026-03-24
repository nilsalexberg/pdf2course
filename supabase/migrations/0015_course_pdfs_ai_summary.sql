-- Adiciona a coluna ai_summary (jsonb) à tabela course_pdfs para armazenar
-- o mapeamento estrutural de conhecimento gerado pelo Gemini no Step 5 do pipeline.
ALTER TABLE course_pdfs ADD COLUMN ai_summary jsonb DEFAULT NULL;

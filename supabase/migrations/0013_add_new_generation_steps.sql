-- Adiciona os novos passos do pipeline ao enum de status de geração
-- Isso é necessário para que o backend possa reportar o progresso granular (embeddings e sumarização)
ALTER TYPE course_generation_status ADD VALUE 'embedding';
ALTER TYPE course_generation_status ADD VALUE 'summarizing';

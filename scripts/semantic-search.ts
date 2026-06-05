import process from 'node:process';
import { createClient } from '@supabase/supabase-js';
import { embedBatch } from '../server/services/gemini/embedChunks';

async function runSearch() {
  const courseId = process.argv[2];
  const query = process.argv[3];

  if (!courseId || !query) {
    console.log(
      'Uso: npx tsx --env-file=.env scripts/semantic-search.ts <courseId> "sua pergunta"'
    );
    process.exit(1);
  }

  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  console.log(`🔎 Buscando por: "${query}"...`);

  // 1. Gera o embedding da pergunta usando o Gemini
  const [queryVector] = await embedBatch([query]);

  // 2. Chama a função RPC que criamos no Passo 1
  const { data, error } = await adminClient.rpc('match_document_chunks', {
    query_embedding: queryVector,
    match_threshold: 0.3, // 30% de similaridade
    match_count: 5, // Top 5 resultados
    p_courseId: courseId
  });

  if (error) {
    console.error('❌ Erro na busca:', error.message);
    return;
  }

  console.log('\n--- RESULTADOS ENCONTRADOS ---');
  data.forEach((res: any, i: number) => {
    console.log(`\n[${i + 1}] Similarity: ${(res.similarity * 100).toFixed(2)}%`);
    console.log(`"${res.content.substring(0, 200)}..."`); // Mostra só o começo
  });
}

runSearch();

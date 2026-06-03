import process from 'node:process';
import { createClient } from '@supabase/supabase-js';
import { processCourseGeneration } from '../server/services/courses/processCourseGeneration';

/**
 * Script de teste local para processamento de cursos.
 * Executa a lógica de extração, chunking e embeddings sem usar Redis/BullMQ.
 *
 * Uso: npx tsx --env-file=.env scripts/test-generation.ts <COURSE_ID>
 */
async function runTest() {
  const courseId = process.argv[2];

  if (!courseId) {
    console.error('❌ Erro: Forneça o ID do curso como argumento.');
    console.log('Uso: npx tsx --env-file=.env scripts/test-generation.ts <COURSE_ID>');
    process.exit(1);
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Erro: SUPABASE_URL ou SUPABASE_SERVICE_KEY não encontrados no ambiente.');
    process.exit(1);
  }

  console.log(`\n🚀 [LOCAL TEST] Iniciando processamento para o Curso: ${courseId}`);
  console.log('------------------------------------------------------------');

  // Inicializa o cliente com o Service Key para ignorar RLS e ter acesso administrativo
  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const startTime = Date.now();

    await processCourseGeneration(courseId, adminClient);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('------------------------------------------------------------');
    console.log(`✅ [LOCAL TEST] Concluído com sucesso em ${duration}s!`);
  } catch (err: any) {
    console.error('\n❌ [LOCAL TEST] Falha crítica no processamento:');
    console.error(err?.message || err);
    process.exit(1);
  }
}

runTest();

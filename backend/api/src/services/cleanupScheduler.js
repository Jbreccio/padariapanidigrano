// backend/src/services/cleanupScheduler.js
import { runCleanup } from './databaseService.js';
import cron from 'node-cron';

// Executar limpeza todos os dias à meia-noite
export const startCleanupScheduler = () => {
  cron.schedule('0 0 * * *', () => {
    console.log('⏰ Executando limpeza agendada...');
    runCleanup();
  });
  
  console.log('✅ Agendador de limpeza configurado (diário à meia-noite)');
  
  // Executar imediatamente ao iniciar
  runCleanup();
};
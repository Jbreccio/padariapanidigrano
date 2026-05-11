// backend/src/services/databaseService.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');
const PRAYERS_FILE = path.join(DATA_DIR, 'prayers.json');
const CANDLES_FILE = path.join(DATA_DIR, 'candles.json');

// Garantir que o diretório existe
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Inicializar arquivos se não existirem
if (!fs.existsSync(PRAYERS_FILE)) {
  fs.writeFileSync(PRAYERS_FILE, JSON.stringify([], null, 2));
}
if (!fs.existsSync(CANDLES_FILE)) {
  fs.writeFileSync(CANDLES_FILE, JSON.stringify([], null, 2));
}

// Função para limpar registros antigos (mais de 7 dias)
const cleanOldRecords = (records) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return records.filter(record => new Date(record.timestamp) > sevenDaysAgo);
};

// Salvar dados
export const saveToDatabase = async (data) => {
  try {
    const file = data.type === 'prayer_request' ? PRAYERS_FILE : CANDLES_FILE;
    
    // Ler dados existentes
    const existingData = JSON.parse(fs.readFileSync(file, 'utf8'));
    
    // Adicionar novo registro com ID
    const newRecord = {
      id: Date.now(), // ID baseado no timestamp
      ...data,
      createdAt: new Date().toISOString()
    };
    
    const updatedData = [newRecord, ...existingData];
    
    // Limpar registros antigos antes de salvar
    const cleanedData = cleanOldRecords(updatedData);
    
    // Salvar no arquivo
    fs.writeFileSync(file, JSON.stringify(cleanedData, null, 2));
    
    console.log(`✅ ${data.type === 'prayer_request' ? 'Oração' : 'Vela'} salva no banco de dados`);
    
    return newRecord;
    
  } catch (error) {
    console.error('❌ Erro ao salvar no banco de dados:', error);
    throw error;
  }
};

// Ler dados para o frontend (apenas dos últimos 7 dias)
export const getCandlesForFrontend = () => {
  try {
    const candlesData = JSON.parse(fs.readFileSync(CANDLES_FILE, 'utf8'));
    
    // Já está filtrado por 7 dias na função saveToDatabase
    // Formatar para o frontend
    return candlesData.map(candle => ({
      id: candle.id,
      name: candle.name,
      intention: "Quem acendeu?", // Texto fixo como no seu frontend
      cityState: `${candle.intention}\n${candle.city}, ${candle.state}`,
      timestamp: getTimeAgo(candle.createdAt),
      createdAt: new Date(candle.createdAt)
    }));
    
  } catch (error) {
    console.error('❌ Erro ao ler velas:', error);
    return [];
  }
};

// Função auxiliar para formatar tempo
const getTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = diffMs / (1000 * 60 * 60);
  
  if (diffHours < 24) return "Hoje";
  if (diffHours < 48) return "Ontem";
  if (diffHours < 72) return "2 dias";
  if (diffHours < 96) return "3 dias";
  if (diffHours < 120) return "4 dias";
  if (diffHours < 144) return "5 dias";
  if (diffHours < 168) return "6 dias";
  return "7 dias";
};

// Rotina de limpeza automática (executar periodicamente)
export const runCleanup = () => {
  console.log('🧹 Executando limpeza de registros antigos...');
  
  [PRAYERS_FILE, CANDLES_FILE].forEach(file => {
    try {
      const records = JSON.parse(fs.readFileSync(file, 'utf8'));
      const cleanedRecords = cleanOldRecords(records);
      
      if (cleanedRecords.length < records.length) {
        fs.writeFileSync(file, JSON.stringify(cleanedRecords, null, 2));
        console.log(`✅ ${file}: Removidos ${records.length - cleanedRecords.length} registros antigos`);
      }
    } catch (error) {
      console.error(`❌ Erro ao limpar ${file}:`, error);
    }
  });
};
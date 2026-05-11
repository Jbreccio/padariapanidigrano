// 🔥 SINCRONIZAÇÃO AUTOMÁTICA DEV → PROD

const DEV_URL = "http://localhost:8787/api/dados"; 
const PROD_URL = "https://santuariodefatima.oibreccio.workers.dev/api/importar-dados";

async function sync() {
  try {
    console.log("📡 Buscando dados do DEV...");

    const devRes = await fetch(DEV_URL);
    const devJson = await devRes.json();

    if (!devJson.success || !devJson.dados) {
      throw new Error("❌ Dados inválidos do DEV");
    }

    console.log("✅ Dados do DEV recebidos");

    const dados = devJson.dados;

    console.log("🚀 Enviando para PRODUÇÃO...");

    const prodRes = await fetch(PROD_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        horariosMissas: dados.horariosMissas,
        carrossel: dados.carrossel,
        momentosLiturgicos: dados.momentosLiturgicos,
        popups: dados.popups,
        recados: dados.recados
      })
    });

    const prodJson = await prodRes.json();

    console.log("🔥 RESULTADO PRODUÇÃO:", prodJson);

  } catch (err) {
    console.error("❌ ERRO:", err.message);
  }
}

sync();
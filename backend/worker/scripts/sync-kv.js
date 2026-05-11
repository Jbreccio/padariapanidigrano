import { execSync } from "child_process";

const keys = [
  "dados_site",
  "liturgia",
  "carrossel",
  "momentos"
];

console.log("🔄 Clonando produção → dev...");

keys.forEach((key) => {
  try {
    console.log(`📥 Baixando ${key} da produção...`);

    const value = execSync(
      `wrangler kv:key get ${key} --namespace-id=2102f38f6c264837b68601f3e4032873`,
      { encoding: "utf-8" }
    );

    console.log(`📤 Enviando ${key} para DEV...`);

    execSync(
      `wrangler kv:key put ${key} '${value.replace(/'/g, "\\'")}' --namespace-id=48754d29671b4e48a001947961fdc051`
    );

  } catch (err) {
    console.log(`⚠️ erro na key ${key}`);
  }
});

console.log("✅ Sync finalizado");
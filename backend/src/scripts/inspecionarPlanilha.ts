import "dotenv/config";
import { listTableColumns, listTables, listWorksheets } from "../lib/msGraph";

async function main() {
  console.log("--- Abas (worksheets) ---");
  const worksheets = await listWorksheets();
  for (const ws of worksheets.value) {
    console.log(`- ${ws.name} (id: ${ws.id}, position: ${ws.position})`);
  }

  console.log("\n--- Tabelas do workbook ---");
  const tables = await listTables();
  if (!tables.value.length) {
    console.log("Nenhuma Tabela nomeada encontrada no workbook inteiro.");
  }
  for (const table of tables.value) {
    console.log(`- Tabela "${table.name}" (id: ${table.id})`);
    const columns = await listTableColumns(table.name);
    for (const col of columns.value) {
      console.log(`    coluna[${col.index}]: ${col.name}`);
    }
  }
}

main().catch((err) => {
  console.error("Falha ao inspecionar planilha:", err.message ?? err);
  process.exit(1);
});

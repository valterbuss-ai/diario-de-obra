import { Camera, CheckCircle2, Download, LogOut, Sparkles } from "lucide-react";
import { useMemo } from "react";
import * as XLSX from "xlsx";
import { ThemeToggle } from "../../components/ThemeToggle";
import { useAuth } from "../../contexts/AuthContext";
import { fotoUrl } from "../../services/api";
import { useApiList } from "../../services/hooks";
import { localDoRegistro } from "../../types";
import type { Registro } from "../../types";

function numeroPtBr(value: string, digits = 1) {
  return Number(value).toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function dataPtBr(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

const RECENTE_MS = 1000 * 60 * 60 * 24;

function ehOrigemTerceirizada(r: Registro) {
  return r.usuario?.perfil === "terceirizado";
}

export function Planilha() {
  const { usuario, logout } = useAuth();
  const { data: registros, loading, error } = useApiList<Registro>("/registros?status=enviado");

  const linhas = useMemo(
    () =>
      [...registros].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [registros]
  );

  function exportarExcel() {
    const linhasExcel = linhas.map((r) => ({
      Data: dataPtBr(r.data),
      Origem: ehOrigemTerceirizada(r) ? "Terceirizado" : "Interno",
      Motorista: r.motorista.nome,
      Placa: r.placa.placa,
      Serviço: r.servico.nome,
      Clima: `${r.clima.icone} ${r.clima.condicao}`,
      Usina: `${r.usina.numero} — ${r.usina.nome}`,
      Ticket: r.numeroTicket,
      "Ton.": numeroPtBr(r.toneladas),
      Contrato: r.contrato.codigo,
      "Rodovia / Logradouro": localDoRegistro(r),
      Km: r.km ? numeroPtBr(r.km) : "",
      Cidade: r.cidade,
      "C×L×E": `${numeroPtBr(r.comprimento)}×${numeroPtBr(r.largura)}×${numeroPtBr(r.espessura, 2)}`,
      Lado: { direito: "Direito", esquerdo: "Esquerdo", ambos: "Ambos" }[r.lado] ?? r.lado,
      Fotos: `${r.fotos.filter((f) => f.tipo !== "ticket").length}/4`,
      "Ticket anexado": r.fotos.some((f) => f.tipo === "ticket") ? "Sim" : "Não",
    }));

    const worksheet = XLSX.utils.json_to_sheet(linhasExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registros");
    XLSX.writeFile(workbook, `diario-de-obra-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface/95 px-6 py-4 backdrop-blur">
        <div>
          <p className="text-xs text-gray-400">Diário de Obra · {usuario?.nome}</p>
          <h1 className="text-xl font-bold text-white">Visão do engenheiro</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportarExcel}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-black hover:bg-primary-dark"
          >
            <Download className="h-4 w-4" />
            Exportar para Excel
          </button>
          <ThemeToggle
            iconClassName="h-4 w-4"
            className="rounded-lg border border-border p-2.5 text-gray-400 hover:border-primary hover:text-primary"
          />
          <button
            onClick={logout}
            className="rounded-lg border border-border p-2.5 text-gray-400 hover:border-primary hover:text-primary"
            aria-label="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="p-6">
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full whitespace-nowrap text-left text-sm">
            <thead>
              <tr className="border-b border-border text-gray-400">
                {["Data", "Origem", "Motorista", "Placa", "Serviço", "Clima", "Usina", "Ticket", "Ton.", "Contrato", "Rodovia / Logradouro", "Km", "Cidade", "C×L×E", "Lado", "Fotos"].map(
                  (h) => (
                    <th key={h} className="px-4 py-3 font-medium">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={16} className="px-4 py-6 text-center text-gray-500">
                    Carregando registros...
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={16} className="px-4 py-6 text-center text-red-400">
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && linhas.length === 0 && (
                <tr>
                  <td colSpan={16} className="px-4 py-6 text-center text-gray-500">
                    Nenhum registro enviado pelo app do operador ainda.
                  </td>
                </tr>
              )}
              {!loading &&
                !error &&
                linhas.map((r) => {
                  const isNovo = Date.now() - new Date(r.createdAt).getTime() < RECENTE_MS;
                  const fotosServico = r.fotos.filter((f) => f.tipo !== "ticket");
                  const fotoDoTicket = r.fotos.find((f) => f.tipo === "ticket");
                  const fotosCompletas = fotosServico.length >= 4;
                  return (
                    <tr
                      key={r.id}
                      className={`border-b border-border last:border-0 ${isNovo ? "bg-primary/5" : "hover:bg-surface-alt/60"}`}
                    >
                      <td className="px-4 py-3 text-gray-200">
                        <div className="flex items-center gap-2">
                          {dataPtBr(r.data)}
                          {isNovo && (
                            <span className="flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                              <Sparkles className="h-3 w-3" />
                              Novo
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            ehOrigemTerceirizada(r) ? "bg-admin/15 text-admin" : "bg-primary/15 text-primary"
                          }`}
                        >
                          {ehOrigemTerceirizada(r) ? "Terceirizado" : "Interno"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-200">{r.motorista.nome}</td>
                      <td className="px-4 py-3 text-gray-200">{r.placa.placa}</td>
                      <td className="px-4 py-3 text-gray-200">{r.servico.nome}</td>
                      <td className="px-4 py-3 text-gray-200">
                        {r.clima.icone} {r.clima.condicao}
                      </td>
                      <td className="px-4 py-3 text-gray-200">{r.usina.numero}</td>
                      <td className="px-4 py-3 text-gray-200">
                        <div className="flex items-center gap-1.5">
                          {r.numeroTicket}
                          {fotoDoTicket ? (
                            <a href={fotoUrl(fotoDoTicket.id)} target="_blank" rel="noreferrer" title="Ver foto do ticket">
                              <Camera className="h-3.5 w-3.5 text-success" />
                            </a>
                          ) : (
                            <Camera className="h-3.5 w-3.5 text-gray-600" aria-label="Sem foto do ticket" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-200">{numeroPtBr(r.toneladas)} t</td>
                      <td className="px-4 py-3 text-gray-200">{r.contrato.codigo}</td>
                      <td className="px-4 py-3 text-gray-200">{localDoRegistro(r)}</td>
                      <td className="px-4 py-3 text-gray-200">{r.km ? numeroPtBr(r.km) : "—"}</td>
                      <td className="px-4 py-3 text-gray-200">{r.cidade}</td>
                      <td className="px-4 py-3 text-gray-200">
                        {numeroPtBr(r.comprimento)}×{numeroPtBr(r.largura)}×{numeroPtBr(r.espessura, 2)}
                      </td>
                      <td className="px-4 py-3 text-gray-200 capitalize">{r.lado}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                              fotosCompletas ? "bg-success/15 text-success" : "bg-red-500/15 text-red-400"
                            }`}
                          >
                            {fotosCompletas && <CheckCircle2 className="h-3.5 w-3.5" />}
                            {fotosServico.length}/4
                          </span>
                          {/* Cada foto abre direto do SharePoint. */}
                          {fotosServico.map((f) => (
                            <a
                              key={f.id}
                              href={fotoUrl(f.id)}
                              target="_blank"
                              rel="noreferrer"
                              title={`Ver foto: ${f.tipo}`}
                              className="text-gray-400 hover:text-primary"
                            >
                              <Camera className="h-3.5 w-3.5" />
                            </a>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

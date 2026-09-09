import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { OperadorLayout } from "../../components/OperadorLayout";
import { SelectField, TextField } from "../../components/FormField";
import { useAuth } from "../../contexts/AuthContext";
import { useRegistroDraft } from "../../contexts/RegistroContext";
import { useApiList } from "../../services/hooks";
import type { Clima, Contrato, Motorista, Placa, Servico } from "../../types";

export function Tela1Equipe() {
  const { draft, updateDraft } = useRegistroDraft();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const ehTerceirizado = usuario?.perfil === "terceirizado";

  const { data: motoristas } = useApiList<Motorista>("/motoristas");
  const { data: placas } = useApiList<Placa>("/placas");
  const { data: contratos } = useApiList<Contrato>("/contratos");
  // Prestador terceirizado escolhe a partir da lista de "Serviços de
  // Terceiros" do admin; operador interno usa a lista normal de "Serviços".
  const { data: servicos } = useApiList<Servico>(ehTerceirizado ? "/servicos-terceiros" : "/servicos");
  const { data: climas } = useApiList<Clima>("/climas");

  // Placas também são filtradas por tipo: frota própria pro operador interno,
  // placas marcadas como terceirizadas pro prestador terceirizado.
  const placasAtivas = placas.filter((p) => p.status === "ativo" && p.tipo === (ehTerceirizado ? "terceirizada" : "propria"));
  const contratosAtivos = contratos.filter((c) => c.status === "ativo");
  const servicosAtivos = servicos.filter((s) => s.status === "ativo");
  const climasAtivos = climas.filter((c) => c.status === "ativo");
  const motoristasAtivos = motoristas.filter((m) => m.status === "ativo");

  const podeContinuar =
    draft.motoristaNome.trim().length >= 3 && draft.placaId !== "" && draft.contratoId !== "" && draft.servicoId !== "" && draft.climaId !== "";

  return (
    <OperadorLayout step={1} title="Nova ocorrência" subtitle="Identifique a equipe e as condições do serviço.">
      <div className="flex flex-col gap-5">
        <TextField
          label="Motorista"
          required
          list="motoristas-sugestoes"
          placeholder="Nome do motorista"
          value={draft.motoristaNome}
          onChange={(e) => updateDraft({ motoristaNome: e.target.value })}
        />
        <datalist id="motoristas-sugestoes">
          {motoristasAtivos.map((m) => (
            <option key={m.id} value={m.nome} />
          ))}
        </datalist>

        <SelectField
          label="Placa"
          required
          value={draft.placaId}
          onChange={(e) => updateDraft({ placaId: e.target.value ? Number(e.target.value) : "" })}
        >
          <option value="">Selecione a placa</option>
          {placasAtivas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.placa} · {p.veiculo}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Contrato"
          required
          value={draft.contratoId}
          onChange={(e) => updateDraft({ contratoId: e.target.value ? Number(e.target.value) : "" })}
        >
          <option value="">Selecione o contrato</option>
          {contratosAtivos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.codigo} · {c.orgao} — {c.descricao}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Serviço"
          required
          value={draft.servicoId}
          onChange={(e) => updateDraft({ servicoId: e.target.value ? Number(e.target.value) : "" })}
        >
          <option value="">Selecione o serviço</option>
          {servicosAtivos.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Clima"
          required
          value={draft.climaId}
          onChange={(e) => updateDraft({ climaId: e.target.value ? Number(e.target.value) : "" })}
        >
          <option value="">Selecione o clima</option>
          {climasAtivos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icone} {c.condicao}
            </option>
          ))}
        </SelectField>

        <button
          type="button"
          disabled={!podeContinuar}
          onClick={() => navigate("/operador/carga")}
          className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-4 text-base font-semibold text-black transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          Continuar
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </OperadorLayout>
  );
}

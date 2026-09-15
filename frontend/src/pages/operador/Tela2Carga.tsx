import { ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { OperadorLayout } from "../../components/OperadorLayout";
import { PhotoSlot } from "../../components/PhotoSlot";
import { SelectField, TextField } from "../../components/FormField";
import { cargaPreenchida, useRegistroDraft } from "../../contexts/RegistroContext";
import { useApiList } from "../../services/hooks";
import type { Usina } from "../../types";

export function Tela2Carga() {
  const { draft, updateDraft } = useRegistroDraft();
  const navigate = useNavigate();
  const { data: usinas } = useApiList<Usina>("/usinas");
  const usinasAtivas = usinas.filter((u) => u.status === "ativa");

  const podeContinuar = cargaPreenchida(draft);

  return (
    <OperadorLayout step={2} title="Dados da carga" subtitle="Informe a usina de origem e o ticket de pesagem.">
      <div className="flex flex-col gap-5">
        <SelectField
          label="Usina"
          required
          value={draft.usinaId}
          onChange={(e) => updateDraft({ usinaId: e.target.value ? Number(e.target.value) : "" })}
        >
          <option value="">Selecione a usina</option>
          {usinasAtivas.map((u) => (
            <option key={u.id} value={u.id}>
              Usina {u.numero} — {u.nome.replace(/^Usina\s*/i, "")}
            </option>
          ))}
        </SelectField>

        <div className="flex flex-col gap-2">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <TextField
                label="Número do ticket"
                required
                placeholder="Ex: 48213"
                value={draft.numeroTicket}
                onChange={(e) => updateDraft({ numeroTicket: e.target.value })}
              />
            </div>
            <div className="w-24">
              <PhotoSlot label="Foto" file={draft.fotoTicket} onChange={(file) => updateDraft({ fotoTicket: file })} compact />
            </div>
          </div>
        </div>

        <TextField
          label="Toneladas"
          required
          type="number"
          step="0.1"
          min="0"
          inputMode="decimal"
          placeholder="0,0 t"
          value={draft.toneladas}
          onChange={(e) => updateDraft({ toneladas: e.target.value })}
        />

        <div className="mt-2 flex gap-3">
          <button
            type="button"
            onClick={() => navigate("/operador/equipe")}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-4 py-4 font-semibold text-gray-300 hover:border-primary hover:text-primary"
          >
            <ArrowLeft className="h-5 w-5" />
            Voltar
          </button>
          <button
            type="button"
            disabled={!podeContinuar}
            onClick={() => navigate("/operador/local")}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-4 font-semibold text-black hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continuar
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </OperadorLayout>
  );
}

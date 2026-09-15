import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { api } from "../services/api";
import { useApiList } from "../services/hooks";

export interface FieldConfig {
  name: string;
  label: string;
  type: "text" | "number" | "date" | "select";
  options?: { value: string; label: string }[];
  required?: boolean;
  step?: string;
}

export interface ColumnConfig<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
}

interface CrudPageProps<T extends { id: number }> {
  title: string;
  description: string;
  endpoint: string;
  columns: ColumnConfig<T>[];
  fields: FieldConfig[];
  emptyItem: Record<string, string>;
  matchesSearch: (item: T, term: string) => boolean;
  searchPlaceholder?: string;
}

export function CrudPage<T extends { id: number }>({
  title,
  description,
  endpoint,
  columns,
  fields,
  emptyItem,
  matchesSearch,
  searchPlaceholder,
}: CrudPageProps<T>) {
  const { data, loading, error, reload } = useApiList<T>(endpoint);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [form, setForm] = useState<Record<string, string>>(emptyItem);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    return data.filter((item) => matchesSearch(item, search.trim().toLowerCase()));
  }, [data, search, matchesSearch]);

  function openCreate() {
    setEditing(null);
    setForm(emptyItem);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(item: T) {
    setEditing(item);
    const next: Record<string, string> = { ...emptyItem };
    for (const field of fields) {
      const value = (item as any)[field.name];
      next[field.name] = field.type === "date" && value ? String(value).slice(0, 10) : value != null ? String(value) : "";
    }
    setForm(next);
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await api.put(`${endpoint}/${editing.id}`, form);
      } else {
        await api.post(endpoint, form);
      }
      setModalOpen(false);
      reload();
    } catch (err: any) {
      setFormError(err.response?.data?.message ?? "Não foi possível salvar. Verifique os dados.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: T) {
    if (!window.confirm("Tem certeza que deseja excluir este registro?")) return;
    try {
      await api.delete(`${endpoint}/${item.id}`);
      reload();
    } catch (err: any) {
      window.alert(err.response?.data?.message ?? "Não foi possível excluir este registro.");
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-admin px-4 py-2.5 text-sm font-semibold text-[#fff] hover:brightness-110"
        >
          <Plus className="h-4 w-4" />
          Novo
        </button>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-surface-alt px-3 py-2">
        <Search className="h-4 w-4 text-gray-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder ?? "Buscar..."}
          className="w-full bg-transparent text-sm text-white placeholder:text-gray-500 focus:outline-none"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-gray-400">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 font-medium">
                  {col.label}
                </th>
              ))}
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-6 text-center text-gray-500">
                  Carregando...
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-6 text-center text-red-400">
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && filtered.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-6 text-center text-gray-500">
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              filtered.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-0 hover:bg-surface-alt/60">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-gray-200">
                      {col.render ? col.render(item) : String((item as any)[col.key] ?? "")}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(item)}
                        className="rounded-md border border-border p-1.5 text-gray-400 hover:border-admin hover:text-admin"
                        aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="rounded-md border border-border p-1.5 text-gray-400 hover:border-red-500 hover:text-red-400"
                        aria-label="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{editing ? "Editar" : "Novo"} registro</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-500 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {fields.map((field) => (
                <label key={field.name} className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-gray-300">
                    {field.label}
                    {field.required && <span className="text-admin"> *</span>}
                  </span>
                  {field.type === "select" ? (
                    <select
                      required={field.required}
                      value={form[field.name] ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, [field.name]: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-surface-alt px-3 py-2.5 text-white focus:border-admin focus:outline-none focus:ring-1 focus:ring-admin"
                    >
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      step={field.step}
                      required={field.required}
                      value={form[field.name] ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, [field.name]: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-surface-alt px-3 py-2.5 text-white focus:border-admin focus:outline-none focus:ring-1 focus:ring-admin"
                    />
                  )}
                </label>
              ))}

              {formError && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{formError}</p>}

              <div className="mt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 rounded-lg border border-border py-2.5 text-sm font-semibold text-gray-300 hover:border-gray-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-lg bg-admin py-2.5 text-sm font-semibold text-[#fff] hover:brightness-110 disabled:opacity-60"
                >
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

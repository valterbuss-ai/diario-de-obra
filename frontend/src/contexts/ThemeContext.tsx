import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export type Tema = "escuro" | "claro";

const STORAGE_KEY = "diario:tema";
// Cor da barra do navegador/app instalado, igual ao fundo de cada tema.
const THEME_COLOR: Record<Tema, string> = { escuro: "#0f1115", claro: "#f3f4f6" };

interface ThemeContextValue {
  tema: Tema;
  alternarTema: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function temaSalvo(): Tema {
  try {
    return localStorage.getItem(STORAGE_KEY) === "claro" ? "claro" : "escuro";
  } catch {
    return "escuro";
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(temaSalvo);

  useEffect(() => {
    document.documentElement.dataset.theme = tema === "claro" ? "light" : "dark";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[tema]);
    try {
      localStorage.setItem(STORAGE_KEY, tema);
    } catch {
      // sem armazenamento disponível: o tema vale só nesta sessão
    }
  }, [tema]);

  function alternarTema() {
    setTema((atual) => (atual === "escuro" ? "claro" : "escuro"));
  }

  return <ThemeContext.Provider value={{ tema, alternarTema }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme deve ser usado dentro de ThemeProvider.");
  return ctx;
}

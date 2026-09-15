import { Moon, Sun } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

interface ThemeToggleProps {
  className?: string;
  iconClassName?: string;
  comTexto?: boolean;
}

export function ThemeToggle({ className = "", iconClassName = "h-5 w-5", comTexto = false }: ThemeToggleProps) {
  const { tema, alternarTema } = useTheme();
  const proximo = tema === "escuro" ? "claro" : "escuro";
  const Icon = tema === "escuro" ? Sun : Moon;

  return (
    <button type="button" onClick={alternarTema} className={className} aria-label={`Mudar para tema ${proximo}`} title={`Tema ${proximo}`}>
      <Icon className={iconClassName} />
      {comTexto && <span>Tema {proximo}</span>}
    </button>
  );
}

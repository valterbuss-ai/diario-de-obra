import { Camera, Check, Image as ImageIcon } from "lucide-react";
import { useRef } from "react";

interface PhotoSlotProps {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
  compact?: boolean;
}

export function PhotoSlot({ label, file, onChange, compact }: PhotoSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = file ? URL.createObjectURL(file) : null;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors overflow-hidden ${
          file ? "border-success bg-success/10" : "border-border bg-surface-alt hover:border-primary"
        } ${compact ? "h-28" : "h-36"}`}
      >
        {previewUrl ? (
          <img src={previewUrl} alt={label} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <>
            <Camera className="h-7 w-7 text-gray-400" />
            <ImageIcon className="hidden" />
          </>
        )}
        {file && (
          <span className="absolute right-2 top-2 rounded-full bg-success p-1 text-black">
            <Check className="h-3.5 w-3.5" />
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      <span className="text-center text-sm font-medium text-gray-300">{label}</span>
    </div>
  );
}

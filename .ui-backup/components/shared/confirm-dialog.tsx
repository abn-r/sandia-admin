"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

type ConfirmDialogProps = {
  title: string;
  description: string;
  confirmLabel?: string;
  triggerLabel: string;
  onConfirm: () => Promise<void>;
  triggerVariant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "success";
};

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirmar",
  triggerLabel,
  onConfirm,
  triggerVariant = "destructive",
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant={triggerVariant} size="sm" onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-150 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <button
          aria-label="Cerrar"
          className="absolute inset-0 bg-black/40"
          onClick={() => !loading && setOpen(false)}
          type="button"
        />
        <div
          className={`relative w-full max-w-sm rounded-lg border bg-background p-5 transition-all duration-150 ${open ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="mt-1.5 text-[13px] text-muted-foreground">{description}</p>
          <div className="mt-5 flex justify-end gap-2">
            <Button ref={cancelRef} variant="outline" size="sm" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button variant="destructive" size="sm" onClick={handleConfirm} disabled={loading}>
              {loading ? "Procesando..." : confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

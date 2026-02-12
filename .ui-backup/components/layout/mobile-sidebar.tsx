"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Button } from "@/components/ui/button";

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)}>
        <Menu className="h-5 w-5" />
      </Button>

      <div
        className={`fixed inset-0 z-40 md:hidden transition-opacity duration-200 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <button
          aria-label="Cerrar menu"
          className="absolute inset-0 bg-black/40"
          onClick={() => setOpen(false)}
          type="button"
        />
        <div
          className={`relative h-full w-72 transition-transform duration-200 ease-out ${open ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="absolute right-2 top-3 z-10">
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <AppSidebar />
        </div>
      </div>
    </>
  );
}

import { AlertTriangle, Ban } from "lucide-react";
import { deleteCatalogItemAction } from "@/lib/catalogs/actions";
import type { EntityKey } from "@/lib/catalogs/entities";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type CatalogDeleteActionProps = {
  entityKey: EntityKey;
  idValue: number;
  returnPath: string;
  itemName?: string;
  compact?: boolean;
};

export function CatalogDeleteAction({
  entityKey,
  idValue,
  returnPath,
  itemName,
  compact = true,
}: CatalogDeleteActionProps) {
  const recordName = itemName?.trim() ? `"${itemName.trim()}"` : "este registro";

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size={compact ? "icon-sm" : "xs"}
          variant="ghost"
          className="text-destructive hover:text-destructive"
          type="button"
        >
          <Ban className={compact ? "h-3.5 w-3.5" : "h-3 w-3"} />
          {compact ? null : "Desactivar"}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </AlertDialogMedia>
          <AlertDialogTitle>Desactivar registro?</AlertDialogTitle>
          <AlertDialogDescription>
            Estas a punto de desactivar <strong className="text-foreground">{recordName}</strong>. Esta accion lo
            ocultara de los catalogos activos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <form action={deleteCatalogItemAction}>
            <input type="hidden" name="entityKey" value={entityKey} />
            <input type="hidden" name="id" value={idValue} />
            <input type="hidden" name="returnPath" value={returnPath} />
            <AlertDialogAction variant="destructive" type="submit">
              Desactivar
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

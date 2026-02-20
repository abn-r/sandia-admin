import { AlertTriangle, Ban } from "lucide-react";
import { deleteActivityAction } from "@/lib/activities/actions";
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

export function ActivityDeleteAction({
  activityId,
  title,
  compact = true,
}: {
  activityId: number;
  title?: string;
  compact?: boolean;
}) {
  const recordName = title?.trim() ? `"${title.trim()}"` : "esta actividad";

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
          <AlertDialogTitle>Desactivar actividad?</AlertDialogTitle>
          <AlertDialogDescription>
            Estas a punto de desactivar <strong className="text-foreground">{recordName}</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <form action={deleteActivityAction}>
            <input type="hidden" name="id" value={activityId} />
            <AlertDialogAction variant="destructive" type="submit">
              Desactivar
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

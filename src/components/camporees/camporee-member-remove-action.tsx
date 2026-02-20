"use client";

import { useActionState } from "react";
import { AlertTriangle, Ban, Loader2 } from "lucide-react";
import type { CamporeeActionState } from "@/lib/camporees/actions";
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

const initialState: CamporeeActionState = {};

export function CamporeeMemberRemoveAction({
  action,
  userId,
  memberName,
}: {
  action: (state: CamporeeActionState, payload: FormData) => Promise<CamporeeActionState>;
  userId: string;
  memberName?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const recordName = memberName?.trim() ? `"${memberName.trim()}"` : "este miembro";

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="xs" variant="ghost" className="text-destructive hover:text-destructive" type="button">
          <Ban className="h-3 w-3" />
          Remover
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </AlertDialogMedia>
          <AlertDialogTitle>Remover miembro?</AlertDialogTitle>
          <AlertDialogDescription>
            Estas a punto de remover <strong className="text-foreground">{recordName}</strong> del camporee.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <form action={formAction}>
            <input type="hidden" name="user_id" value={userId} />
            <AlertDialogAction variant="destructive" type="submit" disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Remover
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

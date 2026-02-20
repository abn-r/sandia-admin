"use client";

import { useActionState } from "react";
import { AlertCircle, Loader2, Save } from "lucide-react";
import type { ClubActionState } from "@/lib/clubs/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: ClubActionState = {};

export function ClubMemberRoleForm({
  action,
  defaultRoleId,
}: {
  action: (state: ClubActionState, payload: FormData) => Promise<ClubActionState>;
  defaultRoleId?: number;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-1">
      <div className="flex items-center gap-2">
        <Input
          name="role_id"
          type="number"
          min={1}
          defaultValue={defaultRoleId ? String(defaultRoleId) : ""}
          placeholder="Rol"
          className="h-8 w-24"
          required
        />
        <Button type="submit" size="xs" variant="outline" disabled={pending}>
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Guardar
        </Button>
      </div>
      {state.error ? (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {state.error}
        </p>
      ) : null}
      {state.success ? <p className="text-xs text-success">{state.success}</p> : null}
    </form>
  );
}

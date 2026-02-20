"use client";

import { useActionState } from "react";
import { AlertCircle, Loader2, UserPlus } from "lucide-react";
import type { CamporeeActionState } from "@/lib/camporees/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const initialState: CamporeeActionState = {};

export function CamporeeMemberForm({
  action,
}: {
  action: (state: CamporeeActionState, payload: FormData) => Promise<CamporeeActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <form action={formAction} className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="user_id">ID de usuario</Label>
            <Input id="user_id" name="user_id" placeholder="UUID del miembro" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="camporee_type">Tipo</Label>
            <Select id="camporee_type" name="camporee_type" defaultValue="local" required>
              <option value="local">Local</option>
              <option value="union">Union</option>
            </Select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="club_name">Nombre de club (opcional)</Label>
            <Input id="club_name" name="club_name" placeholder="Club Central" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="insurance_id">Seguro (ID)</Label>
            <Input id="insurance_id" name="insurance_id" type="number" min={1} placeholder="Opcional" />
          </div>

          {state.error ? (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive sm:col-span-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {state.error}
            </div>
          ) : null}

          {state.success ? (
            <div className="rounded-md bg-success/10 px-3 py-2 text-sm text-success sm:col-span-3">
              {state.success}
            </div>
          ) : null}

          <div className="sm:col-span-3">
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {pending ? "Registrando..." : "Registrar miembro"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

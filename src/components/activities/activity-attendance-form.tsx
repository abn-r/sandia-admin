"use client";

import { useActionState } from "react";
import { AlertCircle, CheckSquare, Loader2 } from "lucide-react";
import type { ActivityActionState } from "@/lib/activities/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: ActivityActionState = {};

export function ActivityAttendanceForm({
  action,
}: {
  action: (state: ActivityActionState, payload: FormData) => Promise<ActivityActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="user_ids">IDs de asistentes</Label>
            <Textarea
              id="user_ids"
              name="user_ids"
              placeholder="UUID1, UUID2, UUID3 (separados por coma, espacio o salto de línea)"
              required
            />
          </div>

          {state.error ? (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {state.error}
            </div>
          ) : null}

          {state.success ? (
            <div className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">
              {state.success}
            </div>
          ) : null}

          <div>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckSquare className="h-4 w-4" />}
              {pending ? "Registrando..." : "Registrar asistencia"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

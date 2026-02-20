import Link from "next/link";
import {
  createCatalogItemAction,
  updateCatalogItemAction,
} from "@/lib/catalogs/actions";
import { entityConfigs, type EntityKey } from "@/lib/catalogs/entities";
import { getEntityItemById, getSelectOptions } from "@/lib/catalogs/service";
import { CatalogForm, type CatalogFormValues } from "@/components/catalogs/catalog-form";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";

async function buildSelectOptions(entityKey: EntityKey) {
  const config = entityConfigs[entityKey];
  const keys = config.fields
    .filter((field) => field.type === "select" && field.optionsEntityKey)
    .map((field) => field.optionsEntityKey) as EntityKey[];

  const uniqueKeys = Array.from(new Set(keys));

  const entries = await Promise.all(
    uniqueKeys.map(async (key) => {
      const options = await getSelectOptions(key);
      return [key, options] as const;
    }),
  );

  return Object.fromEntries(entries);
}

function normalizeFormValues(item: Record<string, unknown>): CatalogFormValues {
  const normalized: CatalogFormValues = {};

  Object.entries(item).forEach(([key, value]) => {
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null ||
      value === undefined
    ) {
      normalized[key] = value;
    }
  });

  return normalized;
}

export async function CatalogNewPage({ entityKey }: { entityKey: EntityKey }) {
  const config = entityConfigs[entityKey];

  if (config.allowMutations === false) {
    return (
      <div className="space-y-4">
        <PageHeader
          title={`${config.singularTitle} en modo solo lectura`}
          description="Este catalogo no expone endpoints de creacion/edicion en la API oficial."
        />
        <Link href={config.routeBase}>
          <Button variant="outline">Volver</Button>
        </Link>
      </div>
    );
  }

  const selectOptions = await buildSelectOptions(entityKey);

  const action = createCatalogItemAction.bind(null, entityKey, config.routeBase);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Nuevo ${config.singularTitle}`}
        description={config.description}
        actions={
          <Link href={config.routeBase}>
            <Button variant="outline">Volver</Button>
          </Link>
        }
      />

      <CatalogForm
        entityKey={entityKey}
        action={action}
        selectOptions={selectOptions}
        submitLabel={`Crear ${config.singularTitle}`}
      />
    </div>
  );
}

export async function CatalogEditPage({ entityKey, id }: { entityKey: EntityKey; id: number }) {
  const config = entityConfigs[entityKey];

  if (config.allowMutations === false) {
    return (
      <div className="space-y-4">
        <PageHeader
          title={`${config.singularTitle} en modo solo lectura`}
          description="Este catalogo no expone endpoints de creacion/edicion en la API oficial."
        />
        <Link href={config.routeBase}>
          <Button variant="outline">Volver</Button>
        </Link>
      </div>
    );
  }

  const item = await getEntityItemById(entityKey, id);

  if (!item) {
    return (
      <div className="space-y-4">
        <PageHeader title={`${config.singularTitle} no encontrado`} />
        <Link href={config.routeBase}>
          <Button variant="outline">Volver</Button>
        </Link>
      </div>
    );
  }

  const selectOptions = await buildSelectOptions(entityKey);
  const action = updateCatalogItemAction.bind(null, entityKey, id, config.routeBase);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Editar ${config.singularTitle}`}
        description={config.description}
        actions={
          <Link href={config.routeBase}>
            <Button variant="outline">Volver</Button>
          </Link>
        }
      />

      <CatalogForm
        entityKey={entityKey}
        action={action}
        selectOptions={selectOptions}
        defaultValues={normalizeFormValues(item)}
        submitLabel={`Guardar ${config.singularTitle}`}
      />
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTableToolbar } from "@/components/shared/data-table-toolbar";
import { EmptyState } from "@/components/shared/empty-state";

export type DataTableColumn<T> = {
  key: string;
  title: string;
  render: (item: T) => React.ReactNode;
  searchableValue?: (item: T) => string;
};

export function DataTable<T>({
  columns,
  rows,
  searchPlaceholder,
  emptyTitle,
  emptyDescription,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  searchPlaceholder?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const [query, setQuery] = useState("");

  const filteredRows = useMemo(() => {
    if (!query.trim()) {
      return rows;
    }

    const normalized = query.trim().toLowerCase();
    return rows.filter((row) =>
      columns.some((column) => {
        const value = column.searchableValue?.(row);
        return value ? value.toLowerCase().includes(normalized) : false;
      }),
    );
  }, [columns, query, rows]);

  const columnDefs = useMemo<ColumnDef<T>[]>(
    () =>
      columns.map((column) => ({
        id: column.key,
        header: column.title,
        cell: ({ row }) => column.render(row.original),
      })),
    [columns],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredRows,
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <DataTableToolbar value={query} onChange={setQuery} placeholder={searchPlaceholder} />

      {filteredRows.length === 0 ? (
        <EmptyState
          title={emptyTitle ?? "No hay registros"}
          description={emptyDescription ?? "Ajusta tus filtros o agrega un nuevo elemento."}
        />
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

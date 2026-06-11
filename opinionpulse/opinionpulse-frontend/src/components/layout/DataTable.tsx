import type { ReactNode } from "react"
import { proCard, tableHeader, tableRow } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

type DataTableProps = {
  children: ReactNode
  className?: string
}

export function DataTable({ children, className }: DataTableProps) {
  return (
    <div className={cn(proCard, "overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">{children}</table>
      </div>
    </div>
  )
}

type DataTableHeadProps = {
  children: ReactNode
}

export function DataTableHead({ children }: DataTableHeadProps) {
  return <thead>{children}</thead>
}

type DataTableBodyProps = {
  children: ReactNode
}

export function DataTableBody({ children }: DataTableBodyProps) {
  return <tbody>{children}</tbody>
}

type DataTableRowProps = {
  children: ReactNode
  className?: string
}

export function DataTableRow({ children, className }: DataTableRowProps) {
  return <tr className={cn(tableRow, className)}>{children}</tr>
}

type DataTableHeaderCellProps = {
  children: ReactNode
  className?: string
}

export function DataTableHeaderCell({ children, className }: DataTableHeaderCellProps) {
  return (
    <th className={cn(tableHeader, "px-4 py-3", className)} scope="col">
      {children}
    </th>
  )
}

type DataTableCellProps = {
  children: ReactNode
  className?: string
}

export function DataTableCell({ children, className }: DataTableCellProps) {
  return (
    <td className={cn("px-4 py-3.5 text-foreground", className)}>{children}</td>
  )
}

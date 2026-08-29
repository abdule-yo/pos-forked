"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTableToolbar } from "@/components/data-table-toolbar";
import { DataTablePagination } from "@/components/data-table-pagination";
import { EmptyState } from "@/components/empty-state";
import { Inbox, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ColumnDef<T> {
    header: string;
    accessorKey?: keyof T;
    cell?: (item: T) => React.ReactNode;
    exportValue?: (item: T) => string;
    align?: "left" | "center" | "right";
    /**
     * Secondary columns drop away on a phone rather than forcing a sideways
     * scroll. Mark everything that isn't essential to recognising the row.
     */
    priority?: "primary" | "secondary";
}

interface DataTableProps<T> {
    data: T[];
    columns: ColumnDef<T>[];
    searchKey?: keyof T | ((item: T) => string);
    searchPlaceholder?: string;
    filterKey?: keyof T | ((item: T) => string);
    filterOptions?: string[];
    emptyMessage?: string;
    emptyDescription?: string;
    emptyIcon?: LucideIcon;
    emptyAction?: React.ReactNode;
    showExport?: boolean;
    exportFilenamePrefix?: string;
    toolbarActions?: React.ReactNode;
    /** Paints each row's leading edge in its category colour. */
    rowAccent?: (item: T) => string;
}

export function DataTable<T>({
    data,
    columns,
    searchKey,
    searchPlaceholder = "Search...",
    filterKey,
    filterOptions = [],
    emptyMessage = "Nothing here yet",
    emptyDescription,
    emptyIcon = Inbox,
    emptyAction,
    showExport = false,
    exportFilenamePrefix = "Export",
    toolbarActions,
    rowAccent,
}: DataTableProps<T>) {
    const [searchQuery, setSearchQuery] = useState("");
    const [filterValue, setFilterValue] = useState("all");
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    // Apply filtering
    let processedData = data;

    if (searchQuery && searchKey) {
        processedData = processedData.filter((item) => {
            const val = typeof searchKey === "function" ? searchKey(item) : item[searchKey];
            return String(val ?? "").toLowerCase().includes(searchQuery.toLowerCase());
        });
    }

    if (filterValue !== "all" && filterKey) {
        processedData = processedData.filter((item) => {
            const val = typeof filterKey === "function" ? filterKey(item) : item[filterKey];
            return String(val ?? "") === filterValue;
        });
    }

    const totalItems = processedData.length;
    const paginatedData = processedData.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

    const handleExport = (type: 'excel' | 'pdf') => {
        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `${exportFilenamePrefix}_${dateStr}`;
        
        if (type === 'excel') {
            import("papaparse").then((Papa) => {
                const csv = Papa.unparse(processedData.map((item: any) => {
                    const row: Record<string, any> = {};
                    columns.forEach((col) => {
                        if (col.accessorKey || col.exportValue) {
                            if (col.exportValue) {
                                row[col.header] = col.exportValue(item);
                            } else {
                                const val = item[col.accessorKey!];
                                row[col.header] = typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val ?? "-");
                            }
                        }
                    });
                    return row;
                }));
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", `${filename}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
        } else if (type === 'pdf') {
            import("jspdf").then((jsPDF) => {
                import("jspdf-autotable").then((autoTable) => {
                    const doc = new jsPDF.default();
                    const exportColumns = columns.filter(col => col.accessorKey || col.exportValue);
                    const tableColumn = exportColumns.map(col => col.header);
                    const tableRows = processedData.map((item: any) => {
                        return exportColumns.map(col => {
                            if (col.exportValue) {
                                return col.exportValue(item);
                            }
                            const val = item[col.accessorKey!];
                            return typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val ?? "-");
                        });
                    });
                    
                    autoTable.default(doc, {
                        head: [tableColumn],
                        body: tableRows,
                        headStyles: { fillColor: [66, 48, 84] }, // Plum, matching the app
                        styles: { fontSize: 9 },
                    });
                    
                    doc.save(`${filename}.pdf`);
                });
            });
        }
    };

    return (
        <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <DataTableToolbar 
                searchPlaceholder={searchPlaceholder}
                searchQuery={searchQuery}
                onSearch={(val) => {
                    setSearchQuery(val);
                    setPageIndex(0);
                }}
                showFilter={filterOptions.length > 0}
                filterOptions={filterOptions}
                filterValue={filterValue}
                onFilterChange={(val) => {
                    setFilterValue(val);
                    setPageIndex(0);
                }}
                showExport={showExport}
                onExport={handleExport}
            >
                {toolbarActions}
            </DataTableToolbar>
            
            <div className="flex-1 overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                            {columns.map((col, i) => (
                                <TableHead
                                    key={i}
                                    className={cn(
                                        "h-11 bg-muted/40 text-xs font-semibold tracking-wide text-muted-foreground uppercase",
                                        col.align === "right" && "text-right",
                                        col.align === "center" && "text-center",
                                        col.priority === "secondary" && "hidden md:table-cell"
                                    )}
                                >
                                    {col.header}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedData.map((item, rowIndex) => (
                            <TableRow
                                key={rowIndex}
                                className="border-border transition-colors hover:bg-muted/40"
                                style={
                                    rowAccent
                                        ? ({ ["--spine-color"]: rowAccent(item) } as React.CSSProperties)
                                        : undefined
                                }
                            >
                                {columns.map((col, colIndex) => (
                                    <TableCell
                                        key={colIndex}
                                        className={cn(
                                            "py-3.5 text-sm",
                                            colIndex === 0 && rowAccent && "cat-spine-cell pl-5",
                                            col.align === "right" && "text-right",
                                            col.align === "center" && "text-center",
                                            col.priority === "secondary" && "hidden md:table-cell"
                                        )}
                                    >
                                        {col.cell
                                            ? col.cell(item)
                                            : col.accessorKey ? String(item[col.accessorKey] ?? "-") : null}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                        {paginatedData.length === 0 && (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={columns.length} className="p-0">
                                    <EmptyState
                                        icon={emptyIcon}
                                        title={searchQuery ? "Nothing matches that" : emptyMessage}
                                        description={
                                            searchQuery
                                                ? "Try a shorter word or clear the search."
                                                : emptyDescription
                                        }
                                        action={searchQuery ? undefined : emptyAction}
                                    />
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <DataTablePagination 
                totalItems={totalItems}
                pageSize={pageSize}
                pageIndex={pageIndex}
                onPageChange={setPageIndex}
                onPageSizeChange={setPageSize}
            />
        </div>
    );
}

"use client";

import { Search, Filter, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DataTableToolbarProps {
    searchPlaceholder?: string;
    searchQuery?: string;
    onSearch?: (value: string) => void;
    showFilter?: boolean;
    showExport?: boolean;
    filterOptions?: string[];
    filterValue?: string;
    onFilterChange?: (value: string) => void;
    onExport?: (type: 'excel' | 'pdf') => void;
    children?: React.ReactNode;
}

export function DataTableToolbar({
    searchPlaceholder = "Search…",
    searchQuery,
    onSearch,
    showFilter = true,
    showExport = false,
    filterOptions = [],
    filterValue = "all",
    onFilterChange,
    onExport,
    children,
}: DataTableToolbarProps) {
    return (
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center">
                <div className="relative w-full sm:w-[280px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder={searchPlaceholder}
                        value={searchQuery}
                        className="h-10 w-full rounded-xl pl-9"
                        onChange={(e) => onSearch?.(e.target.value)}
                    />
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                {showFilter && filterOptions.length > 0 && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-10 rounded-xl">
                                <Filter className="mr-2 size-4" />
                                {filterValue === "all" ? "All categories" : filterValue}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[150px]">
                            <DropdownMenuLabel>Show only</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem
                                checked={filterValue === "all"}
                                onCheckedChange={() => onFilterChange?.("all")}
                                
                            >
                                Everything
                            </DropdownMenuCheckboxItem>
                            {filterOptions.map((option) => (
                                <DropdownMenuCheckboxItem
                                    key={option}
                                    checked={filterValue === option}
                                    onCheckedChange={() => onFilterChange?.(option)}
                                    
                                >
                                    {option}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
                {showExport && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-10 rounded-xl">
                                <Download className="mr-2 size-4" />
                                Export
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[150px]">
                            <DropdownMenuLabel>Download as</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem 
                                className="cursor-pointer"
                                onClick={() => onExport?.('excel')}
                            >
                                Spreadsheet (CSV)
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem 
                                className="cursor-pointer"
                                onClick={() => onExport?.('pdf')}
                            >
                                PDF
                            </DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
                {children}
            </div>
        </div>
    );
}

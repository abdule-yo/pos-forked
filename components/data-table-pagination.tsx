"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DataTablePaginationProps {
  pageSize?: number;
  totalItems?: number;
  pageIndex?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export function DataTablePagination({
  pageSize = 10,
  totalItems = 0,
  pageIndex = 0,
  onPageChange,
  onPageSizeChange,
}: DataTablePaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const isFirstPage = pageIndex === 0;
  const isLastPage = pageIndex >= totalPages - 1;

  // Simple logic to show a few page buttons
  const getPageNumbers = () => {
    const pages = [];
    let start = Math.max(0, pageIndex - 1);
    let end = Math.min(totalPages - 1, pageIndex + 1);
    
    if (pageIndex === 0) {
      end = Math.min(totalPages - 1, 2);
    } else if (pageIndex === totalPages - 1) {
      start = Math.max(0, totalPages - 3);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
      <div className="flex items-center space-x-2">
        <Select
          value={`${pageSize}`}
          onValueChange={(val) => {
            onPageSizeChange?.(Number(val));
            onPageChange?.(0); // Reset to first page
          }}
        >
          <SelectTrigger className="h-8 w-[70px] text-[12px] bg-background border-border/50">
            <SelectValue placeholder={pageSize} />
          </SelectTrigger>
          <SelectContent side="top">
            {[10, 20, 30, 40, 50].map((size) => (
              <SelectItem key={size} value={`${size}`} className="text-[12px]">
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[12px] text-muted-foreground font-medium">Rows per page</p>
      </div>

      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex w-[100px] items-center justify-center text-[12px] font-medium text-foreground whitespace-nowrap">
          Page {pageIndex + 1} of {totalPages} ({totalItems})
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex border-border/50 hover:bg-muted/50 text-muted-foreground disabled:opacity-50"
            disabled={isFirstPage}
            onClick={() => onPageChange?.(0)}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft className="h-4 w-4" strokeWidth={1.5} />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0 border-border/50 hover:bg-muted/50 text-muted-foreground disabled:opacity-50"
            disabled={isFirstPage}
            onClick={() => onPageChange?.(pageIndex - 1)}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
          </Button>
          
          <div className="flex items-center gap-1 mx-2">
            {pageNumbers[0] > 0 && (
              <>
                <Button 
                  variant="ghost" 
                  className="h-8 w-8 p-0 text-[12px] font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => onPageChange?.(0)}
                >
                  1
                </Button>
                {pageNumbers[0] > 1 && <span className="text-muted-foreground mx-1 text-xs">...</span>}
              </>
            )}

            {pageNumbers.map((p) => (
              <Button
                key={p}
                variant={p === pageIndex ? "default" : "ghost"}
                className={`h-8 w-8 p-0 text-[12px] font-medium ${
                  p === pageIndex 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => onPageChange?.(p)}
              >
                {p + 1}
              </Button>
            ))}

            {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
              <>
                {pageNumbers[pageNumbers.length - 1] < totalPages - 2 && <span className="text-muted-foreground mx-1 text-xs">...</span>}
                <Button 
                  variant="ghost" 
                  className="h-8 w-8 p-0 text-[12px] font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => onPageChange?.(totalPages - 1)}
                >
                  {totalPages}
                </Button>
              </>
            )}
          </div>

          <Button
            variant="outline"
            className="h-8 w-8 p-0 border-border/50 hover:bg-muted/50 text-muted-foreground disabled:opacity-50"
            disabled={isLastPage}
            onClick={() => onPageChange?.(pageIndex + 1)}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex border-border/50 hover:bg-muted/50 text-muted-foreground disabled:opacity-50"
            disabled={isLastPage}
            onClick={() => onPageChange?.(totalPages - 1)}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight className="h-4 w-4" strokeWidth={1.5} />
          </Button>
        </div>
      </div>
    </div>
  );
}

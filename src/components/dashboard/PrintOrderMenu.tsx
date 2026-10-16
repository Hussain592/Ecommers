import { FileText, Printer, Tag } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { printOrdersUrl } from "@/lib/print";

export function PrintOrderMenu({ orderId }: { orderId: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-lg"
          aria-label={`Print documents for order ${orderId}`}
        >
          <Printer aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />
          Print
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <a href={printOrdersUrl([orderId], "label")} target="_blank" rel="noopener">
            <Tag aria-hidden="true" className="mr-2 h-4 w-4" />
            Shipping label
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={printOrdersUrl([orderId], "invoice")} target="_blank" rel="noopener">
            <FileText aria-hidden="true" className="mr-2 h-4 w-4" />
            Invoice
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

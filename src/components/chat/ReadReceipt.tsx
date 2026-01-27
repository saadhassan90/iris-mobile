import { Check, CheckCheck, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MessageStatus } from "@/hooks/useConversations";

interface ReadReceiptProps {
  status: MessageStatus;
  className?: string;
}

const ReadReceipt = ({ status, className }: ReadReceiptProps) => {
  if (status === 'sending') {
    return null; // No tick while sending
  }

  if (status === 'failed') {
    return (
      <div className={cn("flex items-center gap-1 text-destructive", className)}>
        <AlertCircle className="h-3 w-3" />
        <span className="text-[10px]">Tap to retry</span>
      </div>
    );
  }

  if (status === 'delivered') {
    return (
      <Check className={cn("h-3 w-3 text-muted-foreground", className)} />
    );
  }

  if (status === 'transferred') {
    return (
      <CheckCheck className={cn("h-3 w-3 text-muted-foreground", className)} />
    );
  }

  return null;
};

export default ReadReceipt;

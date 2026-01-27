import { ImagePlus, FileText, PenLine, BarChart3, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SuggestionPillsProps {
  onSuggestionClick?: (suggestion: string) => void;
}

const suggestions = [
  { label: "Create image", icon: ImagePlus, color: "text-emerald-500" },
  { label: "Summarize text", icon: FileText, color: "text-orange-500" },
  { label: "Help me write", icon: PenLine, color: "text-purple-400" },
  { label: "Analyze data", icon: BarChart3, color: "text-sky-500" },
  { label: "More", icon: MoreHorizontal, color: "text-muted-foreground" },
];

const SuggestionPills = ({ onSuggestionClick }: SuggestionPillsProps) => {
  return (
    <div className="flex flex-wrap justify-center gap-2 px-4">
      {suggestions.map((suggestion) => (
        <Button
          key={suggestion.label}
          variant="outline"
          className="h-10 rounded-full border-border bg-background px-4 font-normal"
          onClick={() => onSuggestionClick?.(suggestion.label)}
        >
          <suggestion.icon className={`h-4 w-4 mr-2 ${suggestion.color}`} />
          <span className="text-foreground">{suggestion.label}</span>
        </Button>
      ))}
    </div>
  );
};

export default SuggestionPills;

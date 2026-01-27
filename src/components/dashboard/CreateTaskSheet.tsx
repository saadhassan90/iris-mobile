import { useState } from "react";
import { X, Calendar, Flag, Tag } from "lucide-react";
import { format } from "date-fns";
import { TaskSource } from "@/hooks/useTasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface CreateTaskSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTask: (title: string, source: TaskSource, dueDate?: Date, notes?: string) => void;
}

const priorities = [
  { value: "low", label: "Low", color: "text-muted-foreground" },
  { value: "medium", label: "Medium", color: "text-yellow-600" },
  { value: "high", label: "High", color: "text-destructive" },
];

const sources: { value: TaskSource; label: string }[] = [
  { value: "manual", label: "Manual" },
  { value: "voice", label: "Voice" },
  { value: "email", label: "Email" },
  { value: "fireflies", label: "Fireflies" },
  { value: "other", label: "Other" },
];

const CreateTaskSheet = ({ open, onOpenChange, onCreateTask }: CreateTaskSheetProps) => {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState<Date>();
  const [priority, setPriority] = useState("medium");
  const [source, setSource] = useState<TaskSource>("manual");

  const handleCreate = () => {
    if (!title.trim()) return;
    onCreateTask(title, source, dueDate, notes || undefined);
    // Reset form
    setTitle("");
    setNotes("");
    setDueDate(undefined);
    setPriority("medium");
    setSource("manual");
    onOpenChange(false);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle className="text-left text-xl font-semibold">New Task</DrawerTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Created: {format(new Date(), "MMMM d, yyyy")}
              </p>
            </div>
            <DrawerClose asChild>
              <Button variant="outline" size="sm" className="gap-1.5 rounded-full px-3">
                <X className="h-3.5 w-3.5" />
                Close
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Title Input */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-xs text-muted-foreground">
              Task Title
            </Label>
            <Input
              id="title"
              placeholder="Enter task title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-base font-medium"
            />
          </div>

          {/* Notes/Description */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-xs text-muted-foreground">
              Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Add notes or details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[120px] resize-none"
            />
          </div>

          {/* Metadata Fields */}
          <div className="space-y-3 rounded-lg border border-border p-3">
            {/* Due Date */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Due Date</span>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 justify-end text-right font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    {dueDate ? format(dueDate, "MMM d, yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Priority */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Priority</span>
              </div>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-8 w-auto border-0 bg-transparent shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  {priorities.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <span className={p.color}>{p.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Source */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Source</span>
              </div>
              <Select value={source} onValueChange={(v) => setSource(v as TaskSource)}>
                <SelectTrigger className="h-8 w-auto border-0 bg-transparent shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  {sources.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Footer with Create Button */}
        <div className="border-t border-border p-4">
          <Button
            className="w-full rounded-full"
            onClick={handleCreate}
            disabled={!title.trim()}
          >
            Create Task
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default CreateTaskSheet;

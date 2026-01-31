import { useState } from "react";
import { Search, Filter, X, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { TaskStatus, TaskSource } from "@/hooks/useTasks";
import {
  NOTION_STATUSES,
  STATUS_LABELS,
  ALL_STATUSES,
} from "@/lib/statusConfig";

export interface TaskFiltersState {
  search: string;
  statuses: TaskStatus[];
  sources: TaskSource[];
  hasNotionLink: boolean | null;
  sortBy: "created" | "title" | "status";
  sortOrder: "asc" | "desc";
}

interface TaskFiltersProps {
  filters: TaskFiltersState;
  onFiltersChange: (filters: TaskFiltersState) => void;
  actions?: React.ReactNode;
}

const ALL_SOURCES: TaskSource[] = ["voice", "manual", "email", "fireflies", "notion", "other"];

const sourceLabels: Record<TaskSource, string> = {
  voice: "Voice",
  manual: "Manual",
  email: "Email",
  fireflies: "Fireflies",
  notion: "Notion",
  other: "Other",
};

export const defaultFilters: TaskFiltersState = {
  search: "",
  statuses: [],
  sources: [],
  hasNotionLink: null,
  sortBy: "created",
  sortOrder: "desc",
};

const TaskFilters = ({ filters, onFiltersChange, actions }: TaskFiltersProps) => {
  const [filterOpen, setFilterOpen] = useState(false);

  const activeFilterCount = 
    filters.statuses.length + 
    filters.sources.length + 
    (filters.hasNotionLink !== null ? 1 : 0);

  const handleStatusToggle = (status: TaskStatus) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onFiltersChange({ ...filters, statuses: newStatuses });
  };

  const handleSourceToggle = (source: TaskSource) => {
    const newSources = filters.sources.includes(source)
      ? filters.sources.filter((s) => s !== source)
      : [...filters.sources, source];
    onFiltersChange({ ...filters, sources: newSources });
  };

  const clearFilters = () => {
    onFiltersChange(defaultFilters);
  };

  const hasActiveFilters = activeFilterCount > 0 || filters.search.length > 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Search bar with action buttons */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-9 pr-9 rounded-full"
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full"
              onClick={() => onFiltersChange({ ...filters, search: "" })}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        {actions}
      </div>
      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "rounded-full gap-1.5",
                activeFilterCount > 0 && "border-primary text-primary"
              )}
            >
              <Filter className="h-3.5 w-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 rounded-full px-1.5 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
              <ChevronDown className="h-3.5 w-3.5 ml-0.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="start">
            <div className="p-3 border-b">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Filters</h4>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground"
                    onClick={clearFilters}
                  >
                    Clear all
                  </Button>
                )}
              </div>
            </div>

            <div className="p-3 space-y-4 max-h-80 overflow-y-auto">
              {/* Status filter */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Status
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_STATUSES.map((status) => (
                    <Badge
                      key={status}
                      variant={filters.statuses.includes(status) ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer rounded-full text-xs transition-colors",
                        filters.statuses.includes(status) && "bg-primary"
                      )}
                      onClick={() => handleStatusToggle(status)}
                    >
                      {STATUS_LABELS[status]}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Source filter */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Source
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_SOURCES.map((source) => (
                    <Badge
                      key={source}
                      variant={filters.sources.includes(source) ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer rounded-full text-xs transition-colors",
                        filters.sources.includes(source) && "bg-primary"
                      )}
                      onClick={() => handleSourceToggle(source)}
                    >
                      {sourceLabels[source]}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Notion link filter */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Notion Sync
                </Label>
                <div className="flex gap-2">
                  <Badge
                    variant={filters.hasNotionLink === true ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer rounded-full text-xs transition-colors",
                      filters.hasNotionLink === true && "bg-primary"
                    )}
                    onClick={() =>
                      onFiltersChange({
                        ...filters,
                        hasNotionLink: filters.hasNotionLink === true ? null : true,
                      })
                    }
                  >
                    Synced
                  </Badge>
                  <Badge
                    variant={filters.hasNotionLink === false ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer rounded-full text-xs transition-colors",
                      filters.hasNotionLink === false && "bg-primary"
                    )}
                    onClick={() =>
                      onFiltersChange({
                        ...filters,
                        hasNotionLink: filters.hasNotionLink === false ? null : false,
                      })
                    }
                  >
                    Not synced
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Sort */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Sort by
                </Label>
                <div className="flex gap-2">
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value) =>
                      onFiltersChange({ ...filters, sortBy: value as TaskFiltersState["sortBy"] })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created">Created date</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={filters.sortOrder}
                    onValueChange={(value) =>
                      onFiltersChange({ ...filters, sortOrder: value as TaskFiltersState["sortOrder"] })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Newest</SelectItem>
                      <SelectItem value="asc">Oldest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Active filter badges */}
        {filters.statuses.map((status) => (
          <Badge
            key={status}
            variant="secondary"
            className="rounded-full gap-1 text-xs"
          >
            {STATUS_LABELS[status]}
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={() => handleStatusToggle(status)}
            />
          </Badge>
        ))}
        {filters.sources.map((source) => (
          <Badge
            key={source}
            variant="secondary"
            className="rounded-full gap-1 text-xs"
          >
            {sourceLabels[source]}
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={() => handleSourceToggle(source)}
            />
          </Badge>
        ))}
        {filters.hasNotionLink !== null && (
          <Badge variant="secondary" className="rounded-full gap-1 text-xs">
            {filters.hasNotionLink ? "Synced" : "Not synced"}
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={() => onFiltersChange({ ...filters, hasNotionLink: null })}
            />
          </Badge>
        )}
      </div>
    </div>
  );
};

export default TaskFilters;

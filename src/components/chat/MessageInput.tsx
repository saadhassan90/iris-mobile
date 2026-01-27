import { useState, useRef } from "react";
import { Plus, ArrowUp, X, FileText, Image, Film, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AttachedFile {
  id: string;
  file: File;
  preview?: string;
}

interface MessageInputProps {
  onSendMessage: (content: string, files?: File[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

const getFileIcon = (type: string) => {
  if (type.startsWith("image/")) return Image;
  if (type.startsWith("video/")) return Film;
  if (type.startsWith("audio/")) return Music;
  return FileText;
};

const MessageInput = ({
  onSendMessage,
  disabled = false,
  placeholder = "Ask ChatGPT",
}: MessageInputProps) => {
  const [textInput, setTextInput] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasContent = textInput.trim().length > 0 || attachedFiles.length > 0;

  const handleSend = () => {
    if ((!textInput.trim() && attachedFiles.length === 0) || disabled) return;
    onSendMessage(
      textInput.trim(),
      attachedFiles.length > 0 ? attachedFiles.map((f) => f.file) : undefined
    );
    setTextInput("");
    setAttachedFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };


  const handlePlusClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: AttachedFile[] = Array.from(files).map((file) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      let preview: string | undefined;

      // Create preview for images
      if (file.type.startsWith("image/")) {
        preview = URL.createObjectURL(file);
      }

      return { id, file, preview };
    });

    setAttachedFiles((prev) => [...prev, ...newFiles]);
    // Reset file input
    e.target.value = "";
  };

  const removeFile = (id: string) => {
    setAttachedFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background px-4 pb-6 pt-2">
      <div className="mx-auto max-w-2xl">
        {/* Attached files preview */}
        {attachedFiles.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachedFiles.map((attached) => {
              const FileIcon = getFileIcon(attached.file.type);
              return (
                <div
                  key={attached.id}
                  className="relative flex items-center gap-2 rounded-lg bg-muted px-3 py-2 pr-8"
                >
                  {attached.preview ? (
                    <img
                      src={attached.preview}
                      alt={attached.file.name}
                      className="h-10 w-10 rounded object-cover"
                    />
                  ) : (
                    <FileIcon className="h-6 w-6 text-muted-foreground" />
                  )}
                  <div className="flex flex-col">
                    <span className="max-w-[120px] truncate text-xs font-medium">
                      {attached.file.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(attached.file.size)}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => removeFile(attached.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-center gap-3">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.json,.xml,.zip,.rar"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Plus/Attach button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
            disabled={disabled}
            onClick={handlePlusClick}
          >
            <Plus className="h-6 w-6" />
          </Button>

          {/* Input field */}
          <div className="relative flex-1">
          <Input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              className="h-12 rounded-full border-border bg-muted/50 pl-4 pr-14 text-base placeholder:text-muted-foreground"
            />

            {/* Send button inside input */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <Button
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-full transition-opacity",
                  hasContent
                    ? "bg-foreground text-background hover:bg-foreground/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                )}
                onClick={handleSend}
                disabled={disabled || !hasContent}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;

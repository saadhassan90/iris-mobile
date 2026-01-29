import { useState, useRef, useCallback } from "react";
import { Plus, ArrowUp, X, FileText, Image, Film, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useDictation } from "@/hooks/useDictation";
import VoiceInputButton from "./VoiceInputButton";
import RecordingOverlay from "./RecordingOverlay";

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
  const [isInCancelZone, setIsInCancelZone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice dictation hook
  const handleTranscript = useCallback((transcript: string) => {
    if (transcript.trim()) {
      onSendMessage(transcript.trim());
    }
  }, [onSendMessage]);

  const {
    isRecording,
    isConnecting,
    partialTranscript,
    committedTranscript,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useDictation({ onTranscript: handleTranscript });

  const hasContent = textInput.trim().length > 0 || attachedFiles.length > 0;

  const handleSend = () => {
    console.log('[MessageInput] handleSend called', {
      textInput: textInput.trim(),
      attachedFilesCount: attachedFiles.length,
      attachedFileNames: attachedFiles.map(f => f.file.name),
      attachedFileTypes: attachedFiles.map(f => f.file.type),
    });
    
    if ((!textInput.trim() && attachedFiles.length === 0) || disabled) {
      console.log('[MessageInput] Send blocked - no content or disabled');
      return;
    }
    
    const filesToSend = attachedFiles.length > 0 ? attachedFiles.map((f) => f.file) : undefined;
    console.log('[MessageInput] Calling onSendMessage with files:', filesToSend?.length);
    
    onSendMessage(textInput.trim(), filesToSend);
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
    console.log('[MessageInput] handleFileChange', { 
      fileCount: files?.length, 
      fileNames: files ? Array.from(files).map(f => f.name) : [] 
    });
    
    if (!files) return;

    const newFiles: AttachedFile[] = Array.from(files).map((file) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      let preview: string | undefined;

      // Create preview for images
      if (file.type.startsWith("image/")) {
        preview = URL.createObjectURL(file);
      }

      console.log('[MessageInput] Adding file:', { name: file.name, type: file.type, size: file.size });
      return { id, file, preview };
    });

    setAttachedFiles((prev) => {
      const updated = [...prev, ...newFiles];
      console.log('[MessageInput] attachedFiles updated, count:', updated.length);
      return updated;
    });
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

  const handleStartRecording = useCallback(async () => {
    try {
      await startRecording();
    } catch {
      // Error already handled in hook with toast
    }
  }, [startRecording]);

  const handleStopRecording = useCallback(() => {
    stopRecording();
  }, [stopRecording]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background px-3 sm:px-4 pb-6 pt-2 w-full max-w-full overflow-hidden">
      <div className="mx-auto max-w-2xl w-full">
        {/* Recording overlay */}
        <RecordingOverlay
          isVisible={isRecording}
          partialTranscript={partialTranscript}
          committedTranscript={committedTranscript}
          isInCancelZone={isInCancelZone}
        />

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
            disabled={disabled || isRecording}
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
              disabled={disabled || isRecording}
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
                disabled={disabled || !hasContent || isRecording}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Voice input button */}
          <VoiceInputButton
            isRecording={isRecording}
            isConnecting={isConnecting}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            onCancelRecording={cancelRecording}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
};

export default MessageInput;

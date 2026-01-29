import { useCallback } from "react";
import { useConversationContext } from "@/components/layout/AppLayout";
import ChatThread from "@/components/chat/ChatThread";
import MessageInput from "@/components/chat/MessageInput";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Any image attachment is treated as a business card scan
const shouldTriggerScan = (hasImage: boolean): boolean => {
  return hasImage;
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix to get pure base64
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const Chat = () => {
  const {
    messages,
    addMessage,
    updateMessageStatus,
  } = useConversationContext();

  const handleSendMessage = useCallback(async (content: string, files?: File[]) => {
    // Debug log to trace file passing
    console.log('[Chat] handleSendMessage called', { 
      content, 
      hasFiles: !!files, 
      fileCount: files?.length,
      fileTypes: files?.map(f => f.type)
    });

    if (!content.trim() && (!files || files.length === 0)) return;

    try {
      // Check if this is a business card scan request (any image triggers scan)
      const imageFile = files?.find(f => f.type.startsWith('image/'));
      const shouldScan = shouldTriggerScan(!!imageFile);
      
      console.log('[Chat] Scan detection', { imageFile: imageFile?.name, shouldScan });

      // Add user message - default to scan prompt if only image attached
      const messageContent = content.trim() || (imageFile ? "Scan this business card" : "");
      const userMessage = await addMessage(messageContent, 'user');
      setTimeout(() => updateMessageStatus(userMessage.id, 'transferred'), 300);

      if (shouldScan && imageFile) {
        // Handle business card scanning
        toast.info("Scanning business card...");
        console.log('[Chat] Starting image conversion to base64');
        
        const imageBase64 = await fileToBase64(imageFile);
        console.log('[Chat] Image converted, base64 length:', imageBase64.length);
        
        console.log('[Chat] Invoking scan-business-card function');
        const { data, error } = await supabase.functions.invoke('scan-business-card', {
          body: {
            imageBase64,
            fileName: imageFile.name,
          },
        });

        console.log('[Chat] Scan result', { data, error });

        if (error) {
          console.error('[Chat] Scan function error:', error);
          throw error;
        }

        if (data?.success && data?.contact) {
          const contact = data.contact;
          
          // Check if any meaningful contact info was extracted
          const hasContactInfo = contact.first_name || contact.last_name || 
            contact.email || contact.phone || contact.company;
          
          if (hasContactInfo) {
            // Format contact as a nice response with special marker
            const contactName = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Contact';
            
            const responseMessage = `I've scanned the business card and saved the contact:

<!-- CONTACT_CARD:${JSON.stringify(contact)} -->

**${contactName}** has been added to your contacts!`;

            await addMessage(responseMessage, 'assistant');
          } else {
            // AI couldn't extract any contact info - likely not a business card
            await addMessage("I couldn't find any contact information in that image. Please make sure you're uploading a clear photo of a business card.", 'assistant');
          }
        } else if (data?.error) {
          await addMessage(`I couldn't scan that business card: ${data.error}`, 'assistant');
        } else {
          await addMessage("I had trouble extracting information from that image. Please try with a clearer photo.", 'assistant');
        }
      } else {
        // Regular chat flow
        const conversationHistory = messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        }));

        const { data, error } = await supabase.functions.invoke('clawdbot-chat', {
          body: {
            message: content,
            conversationHistory,
          },
        });

        if (error) throw error;

        if (data?.response) {
          await addMessage(data.response, 'assistant');
        } else if (data?.error) {
          toast.error(data.error);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to get response. Please try again.');
    }
  }, [messages, addMessage, updateMessageStatus]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    handleSendMessage(suggestion);
  }, [handleSendMessage]);

  const handleRetry = useCallback((messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message && message.role === 'user') {
      handleSendMessage(message.content);
    }
  }, [messages, handleSendMessage]);

  return (
    <div className="flex flex-1 flex-col h-full min-h-0 w-full overflow-hidden">
      <ChatThread
        messages={messages}
        onRetry={handleRetry}
        onSuggestionClick={handleSuggestionClick}
      />
      <MessageInput
        onSendMessage={handleSendMessage}
        placeholder="Message Iris..."
      />
    </div>
  );
};

export default Chat;

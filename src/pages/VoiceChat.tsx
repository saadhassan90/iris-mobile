import { useEffect } from "react";

const ELEVENLABS_AGENT_ID = "agent_1801kg8y6bjqes6vewf9f328xz1s";

const VoiceChat = () => {
  useEffect(() => {
    // Load the ElevenLabs widget script
    const script = document.createElement("script");
    script.src = "https://unpkg.com/@elevenlabs/convai-widget-embed";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="flex flex-1 flex-col h-full min-h-0 w-full">
      {/* @ts-ignore - Custom element from ElevenLabs widget */}
      <elevenlabs-convai 
        agent-id={ELEVENLABS_AGENT_ID}
        variant="full"
        style={{ 
          width: "100%", 
          height: "100%",
          flex: 1,
        }}
      />
    </div>
  );
};

export default VoiceChat;

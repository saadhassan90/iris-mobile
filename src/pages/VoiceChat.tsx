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
    <div className="flex-1 w-full h-full relative">
      {/* @ts-ignore - Custom element from ElevenLabs widget */}
      <elevenlabs-convai 
        agent-id={ELEVENLABS_AGENT_ID}
        variant="full"
        style={{ 
          width: "100%", 
          height: "100%",
          position: "absolute",
          inset: 0,
        }}
      />
    </div>
  );
};

export default VoiceChat;

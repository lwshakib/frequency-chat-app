import { Button } from "@/components/ui/button";
import { PhoneOff } from "lucide-react";

export default function CallOverlay({
  text,
  imageUrl,
  onCancel,
}: {
  text: string;
  imageUrl?: string;
  onCancel: () => void;
}) {
  return (
    <div className="absolute top-0 left-0 w-screen h-screen z-50 bg-background/90 flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="caller"
            className="w-24 h-24 rounded-full object-cover"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-muted" />
        )}
        <div className="text-foreground text-xl font-semibold text-center px-6">
          {text}
        </div>
      </div>
      <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center">
        <Button
          variant="destructive"
          size="icon"
          className="w-12 h-12 rounded-full"
          onClick={onCancel}
        >
          <PhoneOff className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}

export default function CallOverlay({ text }: { text: string }) {
  return (
    <div className="absolute top-0 left-0 w-screen h-screen z-50 bg-background flex items-center justify-center">
      <div className="text-white text-xl font-semibold">{text}</div>
    </div>
  );
}

interface TypingIndicatorProps {
  gradient?: [string, string];
}

export default function TypingIndicator({ gradient = ['#7C5CFF', '#FF8FB1'] }: TypingIndicatorProps) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2">
      <span
        className="w-1.5 h-1.5 rounded-full animate-bounce"
        style={{
          background: gradient[1],
          animationDelay: '0ms',
        }}
      />
      <span
        className="w-1.5 h-1.5 rounded-full animate-bounce"
        style={{
          background: gradient[1],
          animationDelay: '150ms',
        }}
      />
      <span
        className="w-1.5 h-1.5 rounded-full animate-bounce"
        style={{
          background: gradient[1],
          animationDelay: '300ms',
        }}
      />
    </div>
  );
}

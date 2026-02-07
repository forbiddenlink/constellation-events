type LoadingSpinnerProps = {
  message?: string;
  size?: "sm" | "md" | "lg";
};

export default function LoadingSpinner({ message = "Loading...", size = "md" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-3"
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-8">
      <div
        className={`animate-spin rounded-full border-aurora border-t-transparent ${sizeClasses[size]}`}
      />
      {message && <p className="text-sm text-starlight/70">{message}</p>}
    </div>
  );
}

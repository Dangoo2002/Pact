export default function LoadingSpinner({ size = 32 }) {
  return (
    <div className="flex items-center justify-center">
      <div
        className="animate-spin rounded-full border-2 border-primary border-t-transparent"
        style={{ width: size, height: size }}
      />
    </div>
  );
}
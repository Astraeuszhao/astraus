export default function ErrorMessage({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div
      className="w-full bg-red-50 dark:bg-red-900/40 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-2 rounded mb-2 text-center text-sm font-medium shadow-sm animate-fade-in"
      role="alert"
    >
      {message}
    </div>
  );
}

// Add this to your global CSS or Tailwind config if you want the same fade-in effect as Toast.
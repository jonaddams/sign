export function AuthDivider() {
  return (
    <div className="relative my-4">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="bg-white px-2 text-gray-500 dark:bg-zinc-900 dark:text-gray-400">
          or send a login link
        </span>
      </div>
    </div>
  );
}

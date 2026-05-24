export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-zinc-200 bg-zinc-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-zinc-500">
            &copy; {currentYear} EMS Express. Všechna práva vyhrazena.
          </p>
          <div className="flex gap-6 text-sm text-zinc-400">
            <span className="text-zinc-600 font-medium">Po–Pá: 7:00 – 20:00</span>
            <span>|</span>
            <span className="text-zinc-600 font-medium">So: 8:00 – 14:00</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
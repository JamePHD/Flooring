import Link from "next/link";
export default function Header() {
  return(
    <header className="bg-white text-gray-800 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
              <img src="/logos/logotest.png" alt="Emperical Flooring Logo" className="w-10 h-10 object-cover rounded-lg" />
            </div>
            <span className="font-bold text-gray-800 text-lg">Emperical Flooring</span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <Link href="/" className="hover:text-blue-400 transition">Home</Link>
            <Link href="/products" className="hover:text-blue-400 transition">Shop</Link>
            <Link href="/drilldown" className="hover:text-blue-400 transition">About</Link>
            <Link href="#" className="hover:text-blue-400 transition">Contact</Link>
          </nav>

          {/* Contact / CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="tel:1300119313"
              className="text-sm hover:text-blue-400 transition"
            >
              ☎️ 1234 567 890
            </Link>

            <Link
              href="/cart"
              className="bg-[#15C4C4] hover:bg-[#109494] text-white text-sm px-4 py-2 rounded-md transition"
            >
              Get a Quote
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
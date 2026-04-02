import Link from "next/link";
export default function Header() {
  return(
    // <header style={{ padding: "16px", background: "blue", color: "white" }}>
    //   <h1>Empirical Solutions</h1>

    //   <nav style={{ marginTop: "10px" }}>
    //     <a href="#" style={{ marginRight: "10px", color: "white" }}>Home</a>
    //     <a href="#" style={{ marginRight: "10px", color: "white" }}>Comparison</a>
    //   </nav>
    // </header>
    <header className="bg-[#074141] text-gray-300 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
              <img src="/logos/logotest.png" alt="Emperical Flooring Logo" className="w-10 h-10 object-cover rounded-lg" />
            </div>
            <span className="font-bold text-white text-lg">Emperical Flooring</span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <Link href="#" className="hover:text-blue-400 transition">Home</Link>
            <Link href="#" className="hover:text-blue-400 transition">Shop</Link>
            <Link href="#" className="hover:text-blue-400 transition">About</Link>
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
              href="#"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md transition"
            >
              Get a Quote
            </Link>
          </div>

          {/* Mobile Menu Placeholder */}
          <button className="md:hidden text-gray-300 hover:text-white transition">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-7 h-7"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
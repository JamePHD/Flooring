import Image from "next/image";
import Link from "next/link";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/compare", label: "Compare" },
  { href: "#", label: "About Us" },
  { href: "/news", label: "News" },
  { href: "#", label: "Contact" },
];

export default function Header() {
  return (
    <header className="bg-primary text-white border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
              <Image
                src="/logos/logotest.png"
                alt="Empirical Flooring Logo"
                width={40}
                height={40}
                priority
                className="w-10 h-10 object-cover rounded-lg"
              />
            </div>
            <span className="font-bold text-gray-100 text-lg">
              Empirical Flooring
            </span>
          </Link>

          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-gray-100">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="hover:text-blue-400 transition"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="tel:1300119313"
              className="text-sm hover:text-blue-400 transition"
            >
              1234 567 890
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

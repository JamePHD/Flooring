import Link from "next/link";
export default function Footer() {
    return(
        <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">EF</span>
                </div>
                <span className="font-bold text-white text-lg">Emperical Flooring</span>
              </div>
              <p className="text-sm">Sydney's premier online flooring specialists with expert advice and fast delivery.</p>
            </div>

            {/* Shop */}
            <div>
              <h4 className="font-bold text-white mb-4">Shop</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-blue-400 transition">Laminate Flooring</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition">Engineered Flooring</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition">Vinyl Flooring</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition">Solid Flooring</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition">Accessories</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-bold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-blue-400 transition">About Us</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition">Blog</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition">Contact</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition">FAQ</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition">Site Map</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-bold text-white mb-4">Contact</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-lg flex-shrink-0">☎️</span>
                  <Link href="tel:1300119313" className="hover:text-blue-400 transition">1234 567 890</Link>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-lg flex-shrink-0">✉️</span>
                  <Link href="mailto:info@iotbayflooring.com.au" className="hover:text-blue-400 transition">info@royalsolulu.com.au</Link>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-lg flex-shrink-0 mt-1">📍</span>
                  <span>Sydney, NSW<br />Australia</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm">
            <p>&copy; 2026 Emperical Flooring Solulu. All Rights Reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link href="#" className="hover:text-blue-400 transition">Privacy Policy</Link>
              <Link href="#" className="hover:text-blue-400 transition">Terms & Conditions</Link>
              <Link href="#" className="hover:text-blue-400 transition">Returns Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    );
}
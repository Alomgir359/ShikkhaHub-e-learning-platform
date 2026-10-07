import React from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="bg-green-800 text-white mt-16">

      <div className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-4 gap-8">

        {/* LOGO SECTION */}
        <div>
          <div className="mb-3"><Logo dark size="sm" /></div>

          <p className="text-sm text-gray-300">
            Deep theory first, syntax later. Learn concepts so well that you can switch to any programming language easily.
            <span className="block mt-2 text-gray-400">মুখস্থ নয়, বোঝা।</span>
          </p>
        </div>

        {/* QUICK LINKS */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Quick Links</h3>

          <ul className="space-y-2 text-sm text-gray-300">

            <li>
              <Link className="hover:text-primary transition" to="/">
                Home
              </Link>
            </li>

            <li>
              <Link className="hover:text-primary transition" to="/courses">
                Courses
              </Link>
            </li>

            <li>
              <Link className="hover:text-primary transition" to="/login">
                Login
              </Link>
            </li>

            <li>
              <button className="hover:text-primary transition">
                Join as Teacher
              </button>
            </li>

          </ul>
        </div>

        {/* SUPPORT */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Support</h3>

          <ul className="space-y-2 text-sm text-gray-300">

            <li>Email: support@shikkhahub.com</li>
            <li>Phone: +880 1XXX-XXXXXX</li>
            <li>Help Center</li>
            <li>Privacy Policy</li>

          </ul>
        </div>

        {/* SOCIAL */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Connect</h3>

          <div className="flex gap-3">

            <div className="w-9 h-9 flex items-center justify-center bg-gray-800 rounded-full hover:bg-primary cursor-pointer transition">
              f
            </div>

            <div className="w-9 h-9 flex items-center justify-center bg-gray-800 rounded-full hover:bg-primary cursor-pointer transition">
              in
            </div>

            <div className="w-9 h-9 flex items-center justify-center bg-gray-800 rounded-full hover:bg-primary cursor-pointer transition">
              yt
            </div>

          </div>

          <p className="text-xs text-gray-400 mt-4">
            Follow us on social media for updates
          </p>
        </div>

      </div>

      {/* BOTTOM BAR */}
      <div className="border-t border-gray-800 py-4 text-center text-sm text-gray-400">
        © 2026 ShikkhaHub | Think deeply, code in any language
      </div>

    </footer>
  );
}
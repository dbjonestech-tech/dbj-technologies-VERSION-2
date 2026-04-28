"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { NAV_LINKS } from "@/lib/constants";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // On the dark About page the wordmark must read white. The cyan mark
  // stays brand cyan; only the wordmark glyphs (which now use
  // currentColor) follow this color. Once the navbar gets its scrolled
  // white panel, switch back to the default dark for legibility.
  const isAboutPage = pathname === "/about";
  const wordmarkColorClass =
    isAboutPage && !scrolled ? "text-white" : "text-[#0F172A]";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/80 backdrop-blur-2xl border-b border-gray-200 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <nav aria-label="Main navigation" className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 xl:px-8">
        {/* Logo */}
        <Link
          href="/"
          className={`relative z-10 flex items-center transition-colors duration-300 ${wordmarkColorClass}`}
          onClick={(e) => {
            if (window.location.pathname === "/") {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
        >
          <svg
            viewBox="0 0 620 214"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-labelledby="nav-logo-title nav-logo-desc"
            className="h-8 w-auto sm:h-10 xl:h-11"
          >
            <title id="nav-logo-title">DBJ Technologies logo</title>
            <desc id="nav-logo-desc">Cyan geometric DBJ mark with dark DBJ Technologies wordmark</desc>
            <path fillRule="evenodd" clipRule="evenodd" d="M173 98L153 87V149L88 189L21 150V88L0 99V160L8 166L87 213H90L93 210L103 205L173 160V98ZM57 67L37 79V143L57 155H59V67H57ZM116 66V154L122 153L123 151L135 145L138 142V77L122 68L116 66ZM116 24L115 26V46L116 48L172 83L173 82V58L125 29L122 26L116 24ZM96 0L92 1L89 4L0 58V82H2L42 58L74 37L76 38V165L87 171L96 167V0Z" fill="#1AD4EA"/>
            <path d="M204.772 116V106.488H212.316V68.112H204.772V58.6H228.388C236.096 58.6 241.945 60.568 245.936 64.504C249.981 68.3853 252.004 74.18 252.004 81.888V92.712C252.004 100.42 249.981 106.242 245.936 110.178C241.945 114.059 236.096 116 228.388 116H204.772ZM223.14 106.16H228.552C232.925 106.16 236.123 105.012 238.146 102.716C240.169 100.42 241.18 97.1947 241.18 93.04V81.56C241.18 77.3507 240.169 74.1253 238.146 71.884C236.123 69.588 232.925 68.44 228.552 68.44H223.14V106.16Z" fill="currentColor"/>
            <path d="M267.383 116V106.488H274.927V68.112H267.383V58.6H296.903C300.402 58.6 303.436 59.2013 306.005 60.404C308.629 61.552 310.652 63.2193 312.073 65.406C313.549 67.538 314.287 70.1073 314.287 73.114V73.934C314.287 76.558 313.795 78.7173 312.811 80.412C311.827 82.052 310.652 83.3367 309.285 84.266C307.973 85.1407 306.716 85.7693 305.513 86.152V87.628C306.716 87.956 308.028 88.5847 309.449 89.514C310.871 90.3887 312.073 91.6733 313.057 93.368C314.096 95.0627 314.615 97.2767 314.615 100.01V100.83C314.615 104.001 313.877 106.734 312.401 109.03C310.925 111.271 308.875 112.993 306.251 114.196C303.682 115.399 300.675 116 297.231 116H267.383ZM285.751 106.16H295.919C298.27 106.16 300.156 105.586 301.577 104.438C303.053 103.29 303.791 101.65 303.791 99.518V98.698C303.791 96.566 303.081 94.926 301.659 93.778C300.238 92.63 298.325 92.056 295.919 92.056H285.751V106.16ZM285.751 82.216H295.755C297.997 82.216 299.828 81.642 301.249 80.494C302.725 79.346 303.463 77.7607 303.463 75.738V74.918C303.463 72.8407 302.753 71.2553 301.331 70.162C299.91 69.014 298.051 68.44 295.755 68.44H285.751V82.216Z" fill="currentColor"/>
            <path d="M349.799 117.148C343.895 117.148 339.193 115.535 335.695 112.31C332.251 109.085 330.529 104.575 330.529 98.78V93.368H341.353V98.78C341.353 101.349 342.063 103.372 343.485 104.848C344.906 106.269 346.901 106.98 349.471 106.98C351.876 106.98 353.735 106.269 355.047 104.848C356.413 103.427 357.097 101.404 357.097 98.78V68.44H347.257V58.6H374.481V68.44H367.921V98.78C367.921 104.739 366.308 109.303 363.083 112.474C359.857 115.59 355.429 117.148 349.799 117.148Z" fill="currentColor"/>
            <path d="M214.664 157V134.96H206.912V130.4H227.432V134.96H219.68V157H214.664Z" fill="currentColor"/>
            <path d="M244.148 157V130.4H261.248V134.96H249.164V141.306H260.184V145.866H249.164V152.44H261.476V157H244.148Z" fill="currentColor"/>
            <path d="M288.597 157.532C285.304 157.532 282.694 156.62 280.769 154.796C278.844 152.947 277.881 150.312 277.881 146.892V140.508C277.881 137.088 278.844 134.466 280.769 132.642C282.694 130.793 285.304 129.868 288.597 129.868C291.865 129.868 294.386 130.767 296.159 132.566C297.958 134.339 298.857 136.784 298.857 139.9V140.128H293.917V139.748C293.917 138.177 293.474 136.885 292.587 135.872C291.726 134.859 290.396 134.352 288.597 134.352C286.824 134.352 285.43 134.897 284.417 135.986C283.404 137.075 282.897 138.557 282.897 140.432V146.968C282.897 148.817 283.404 150.299 284.417 151.414C285.43 152.503 286.824 153.048 288.597 153.048C290.396 153.048 291.726 152.541 292.587 151.528C293.474 150.489 293.917 149.197 293.917 147.652V146.968H298.857V147.5C298.857 150.616 297.958 153.073 296.159 154.872C294.386 156.645 291.865 157.532 288.597 157.532Z" fill="currentColor"/>
            <path d="M316.244 157V130.4H321.26V141.382H331.14V130.4H336.156V157H331.14V145.942H321.26V157H316.244Z" fill="currentColor"/>
            <path d="M354.481 157V130.4H364.019L369.301 153.58H369.985V130.4H374.925V157H365.387L360.105 133.82H359.421V157H354.481Z" fill="currentColor"/>
            <path d="M403.574 157.532C400.23 157.532 397.57 156.62 395.594 154.796C393.618 152.947 392.63 150.312 392.63 146.892V140.508C392.63 137.088 393.618 134.466 395.594 132.642C397.57 130.793 400.23 129.868 403.574 129.868C406.918 129.868 409.578 130.793 411.554 132.642C413.53 134.466 414.518 137.088 414.518 140.508V146.892C414.518 150.312 413.53 152.947 411.554 154.796C409.578 156.62 406.918 157.532 403.574 157.532ZM403.574 153.048C405.449 153.048 406.906 152.503 407.944 151.414C408.983 150.325 409.502 148.868 409.502 147.044V140.356C409.502 138.532 408.983 137.075 407.944 135.986C406.906 134.897 405.449 134.352 403.574 134.352C401.725 134.352 400.268 134.897 399.204 135.986C398.166 137.075 397.646 138.532 397.646 140.356V147.044C397.646 148.868 398.166 150.325 399.204 151.414C400.268 152.503 401.725 153.048 403.574 153.048Z" fill="currentColor"/>
            <path d="M432.218 157V130.4H437.234V152.44H449.394V157H432.218Z" fill="currentColor"/>
            <path d="M475.559 157.532C472.215 157.532 469.555 156.62 467.579 154.796C465.603 152.947 464.615 150.312 464.615 146.892V140.508C464.615 137.088 465.603 134.466 467.579 132.642C469.555 130.793 472.215 129.868 475.559 129.868C478.903 129.868 481.563 130.793 483.539 132.642C485.515 134.466 486.503 137.088 486.503 140.508V146.892C486.503 150.312 485.515 152.947 483.539 154.796C481.563 156.62 478.903 157.532 475.559 157.532ZM475.559 153.048C477.434 153.048 478.891 152.503 479.929 151.414C480.968 150.325 481.487 148.868 481.487 147.044V140.356C481.487 138.532 480.968 137.075 479.929 135.986C478.891 134.897 477.434 134.352 475.559 134.352C473.71 134.352 472.253 134.897 471.189 135.986C470.151 137.075 469.631 138.532 469.631 140.356V147.044C469.631 148.868 470.151 150.325 471.189 151.414C472.253 152.503 473.71 153.048 475.559 153.048Z" fill="currentColor"/>
            <path d="M513.399 157.532C511.575 157.532 509.916 157.127 508.421 156.316C506.952 155.48 505.774 154.277 504.887 152.706C504.026 151.11 503.595 149.172 503.595 146.892V140.508C503.595 137.088 504.558 134.466 506.483 132.642C508.408 130.793 511.018 129.868 514.311 129.868C517.579 129.868 520.1 130.742 521.873 132.49C523.672 134.213 524.571 136.556 524.571 139.52V139.672H519.631V139.368C519.631 138.431 519.428 137.582 519.023 136.822C518.643 136.062 518.06 135.467 517.275 135.036C516.49 134.58 515.502 134.352 514.311 134.352C512.538 134.352 511.144 134.897 510.131 135.986C509.118 137.075 508.611 138.557 508.611 140.432V146.968C508.611 148.817 509.118 150.312 510.131 151.452C511.144 152.567 512.563 153.124 514.387 153.124C516.211 153.124 517.541 152.643 518.377 151.68C519.213 150.717 519.631 149.501 519.631 148.032V147.652H513.323V143.396H524.571V157H519.935V154.454H519.251C519.074 154.885 518.782 155.341 518.377 155.822C517.997 156.303 517.414 156.709 516.629 157.038C515.844 157.367 514.767 157.532 513.399 157.532Z" fill="currentColor"/>
            <path d="M542.663 157V130.4H547.679V157H542.663Z" fill="currentColor"/>
            <path d="M565.983 157V130.4H583.083V134.96H570.999V141.306H582.019V145.866H570.999V152.44H583.311V157H565.983Z" fill="currentColor"/>
            <path d="M609.558 157.532C607.506 157.532 605.694 157.165 604.124 156.43C602.553 155.695 601.324 154.644 600.438 153.276C599.551 151.908 599.108 150.261 599.108 148.336V147.272H604.048V148.336C604.048 149.932 604.542 151.135 605.53 151.946C606.518 152.731 607.86 153.124 609.558 153.124C611.28 153.124 612.56 152.782 613.396 152.098C614.257 151.414 614.688 150.54 614.688 149.476C614.688 148.741 614.472 148.146 614.042 147.69C613.636 147.234 613.028 146.867 612.218 146.588C611.432 146.284 610.47 146.005 609.33 145.752L608.456 145.562C606.632 145.157 605.061 144.65 603.744 144.042C602.452 143.409 601.451 142.585 600.742 141.572C600.058 140.559 599.716 139.241 599.716 137.62C599.716 135.999 600.096 134.618 600.856 133.478C601.641 132.313 602.73 131.426 604.124 130.818C605.542 130.185 607.202 129.868 609.102 129.868C611.002 129.868 612.686 130.197 614.156 130.856C615.65 131.489 616.816 132.452 617.652 133.744C618.513 135.011 618.944 136.607 618.944 138.532V139.672H614.004V138.532C614.004 137.519 613.801 136.708 613.396 136.1C613.016 135.467 612.458 135.011 611.724 134.732C610.989 134.428 610.115 134.276 609.102 134.276C607.582 134.276 606.454 134.567 605.72 135.15C605.01 135.707 604.656 136.48 604.656 137.468C604.656 138.127 604.82 138.684 605.15 139.14C605.504 139.596 606.024 139.976 606.708 140.28C607.392 140.584 608.266 140.85 609.33 141.078L610.204 141.268C612.104 141.673 613.75 142.193 615.144 142.826C616.562 143.459 617.664 144.295 618.45 145.334C619.235 146.373 619.628 147.703 619.628 149.324C619.628 150.945 619.21 152.377 618.374 153.618C617.563 154.834 616.398 155.797 614.878 156.506C613.383 157.19 611.61 157.532 609.558 157.532Z" fill="currentColor"/>
          </svg>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 xl:flex">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            const isPathlight = link.label === "Pathlight";
            const className = isPathlight
              ? "relative rounded-lg px-4 py-2 text-sm font-semibold nav-pathlight"
              : `relative rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-300 ${
                  isActive
                    ? "text-gray-900 font-semibold"
                    : "text-gray-500 hover:text-gray-900"
                }`;
            return (
              <Link key={link.href} href={link.href} className={className}>
                {isPathlight ? (
                  link.label
                ) : (
                  <span className="relative z-10">{link.label}</span>
                )}
                {isActive && !isPathlight && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 rounded-lg bg-gray-100 border border-gray-200/80"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* CTA + Mobile toggle */}
        <div className="flex items-center gap-4">
          <Link
            href="/signin"
            className={`hidden text-sm font-medium transition-colors duration-300 xl:inline-flex ${
              isAboutPage && !scrolled
                ? "text-white/70 hover:text-white"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Client Portal
          </Link>
          <Link
            href="/pathlight#scan-form"
            className="btn-primary hidden text-sm xl:inline-flex"
          >
            Run Free Scan
          </Link>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="relative z-10 flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white xl:hidden"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            id="mobile-menu"
            className="overflow-hidden border-t border-gray-200 bg-white/95 backdrop-blur-2xl xl:hidden"
          >
            <div className="mx-auto max-w-7xl px-6 py-6">
              {NAV_LINKS.map((link, i) => {
                const isPathlight = link.label === "Pathlight";
                const className = isPathlight
                  ? "block rounded-lg px-4 py-3 text-lg font-semibold nav-pathlight"
                  : `block rounded-lg px-4 py-3 text-lg font-medium transition-colors ${
                      pathname === link.href
                        ? "text-accent-blue bg-accent-blue/5"
                        : "text-text-secondary hover:text-gray-900 hover:bg-gray-50"
                    }`;
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={className}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                );
              })}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-4 pt-4 border-t border-gray-200"
              >
                <Link href="/pathlight#scan-form" onClick={() => setIsOpen(false)} className="btn-primary w-full justify-center text-center">
                  Run Free Scan
                </Link>
                <Link
                  href="/signin"
                  onClick={() => setIsOpen(false)}
                  className="mt-3 block w-full rounded-lg px-4 py-3 text-center text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
                >
                  Client Portal
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

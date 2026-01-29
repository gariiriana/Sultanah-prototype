import React, { useState, useEffect } from 'react';

const WhatsAppFloating: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const whatsappLink = 'https://api.whatsapp.com/send/?phone=6281234700116&text&type=phone_number&app_absent=0';
  const phoneNumber = '+62-857-2337-5324';

  // WhatsApp icon as inline SVG (no external dependency)
  const WhatsAppIcon = () => (
    <svg
      viewBox="0 0 24 24"
      fill="white"
      className="w-14 h-14 transition-transform duration-300 group-hover:rotate-12"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );

  useEffect(() => {
    // Show button after a short delay for smooth entrance
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Floating WhatsApp Button */}
      <a
        id="whatsapp-floating-button"
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        className={`fixed bottom-6 right-6 z-50 transition-all duration-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
          }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="Chat on WhatsApp"
      >
        {/* Tooltip - Phone Number */}
        <div
          className={`absolute right-full mr-4 top-1/2 -translate-y-1/2 whitespace-nowrap transition-all duration-300 ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'
            }`}
        >
          <div className="bg-white/95 backdrop-blur-md px-4 py-3 rounded-xl shadow-xl border border-gold/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold via-gold-light to-gold-dark flex items-center justify-center shadow-lg">
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Chat via WhatsApp</p>
                <p className="text-sm font-bold bg-gradient-to-r from-gold via-gold-light to-gold-dark bg-clip-text text-transparent">
                  {phoneNumber}
                </p>
              </div>
            </div>
            {/* Arrow */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
              <div className="w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-8 border-l-white/95"></div>
            </div>
          </div>
        </div>

        {/* WhatsApp Icon with Glassmorphism */}
        <div className="relative group">
          {/* Animated Ring */}
          <div
            className={`absolute inset-0 rounded-full bg-gradient-to-br from-green-400 to-green-600 animate-ping opacity-75 ${isHovered ? 'scale-110' : 'scale-100'
              }`}
            style={{ animationDuration: '2s' }}
          ></div>

          {/* Glow Effect */}
          <div className="absolute inset-0 rounded-full bg-green-500/50 blur-xl group-hover:bg-green-400/70 transition-all duration-300"></div>

          {/* Main Button */}
          <div
            className={`relative bg-white/10 backdrop-blur-md rounded-full p-1 shadow-2xl border-2 border-white/20 transition-all duration-300 ${isHovered ? 'scale-110 border-white/40' : 'scale-100'
              }`}
          >
            <div className="bg-gradient-to-br from-green-400 via-green-500 to-green-600 rounded-full p-1 shadow-lg">
              <WhatsAppIcon />
            </div>
          </div>

          {/* Pulse Indicator */}
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse shadow-lg"></div>
        </div>
      </a>

      {/* Mobile Optimization - Smaller on mobile */}
      <style>{`
        @media (max-width: 640px) {
          .fixed.bottom-6.right-6 {
            bottom: 1rem;
            right: 1rem;
          }
          .fixed.bottom-6.right-6 img {
            width: 3rem;
            height: 3rem;
          }
        }
      `}</style>
    </>
  );
};

export default WhatsAppFloating;
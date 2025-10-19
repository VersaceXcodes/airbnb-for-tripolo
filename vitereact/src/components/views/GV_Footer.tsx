import React from 'react';
import { Link } from 'react-router-dom';

const GV_Footer: React.FC = () => {
  const footerLinks = [
    { name: 'About Us', path: '/about', ariaLabel: 'Learn more about TripoStay' },
    { name: 'Contact', path: '/contact', ariaLabel: 'Get in touch with us' },
    { name: 'FAQ', path: '/faq', ariaLabel: 'Frequently asked questions' },
    { name: 'Privacy Policy', path: '/privacy', ariaLabel: 'View our privacy policy' },
    { name: 'Terms of Service', path: '/terms', ariaLabel: 'View our terms of service' },
  ];

  return (
    <>
      <footer className="bg-gray-50 border-t border-gray-200 pt-8 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {footerLinks.map((link, index) => (
              <div key={index} className="text-center md:text-left">
                <Link
                  to={link.path}
                  aria-label={link.ariaLabel}
                  className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                >
                  {link.name}
                </Link>
              </div>
            ))}
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              &copy; {new Date().getFullYear()} TripoStay. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default GV_Footer;
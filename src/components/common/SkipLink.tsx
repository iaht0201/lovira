import React from 'react';

export const SkipLink: React.FC = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-3 focus:bg-indigo-700 focus:text-white focus:rounded-lg focus:shadow-xl focus:font-bold focus:outline-none focus:ring-4 focus:ring-amber-400"
    >
      Chuyển đến nội dung chính
    </a>
  );
};

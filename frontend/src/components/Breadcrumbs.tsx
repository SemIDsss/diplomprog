'use client';
import React from 'react';

interface CrumbProps {
  path: string[];
}

export default function Breadcrumbs({
  path
}: CrumbProps) {
  return (
    <nav className="text-xxs text-gray-400 font-bold">
      <ol className="list-reset flex space-x-2">
        <li>
          <a href="/" className="hover:text-blue-600">
            Главная
          </a>
        </li>
        {path.map((item, idx) => (
          <li key={idx} className="flex space-x-2">
            <span>/</span>
            <span className={
              idx === path.length - 1 
                ? 'text-gray-700' 
                : 'hover:text-blue-600'
            }>
              {item}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}

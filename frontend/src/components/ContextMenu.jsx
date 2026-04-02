import React, { useEffect, useRef, useState } from 'react';
import { Info, CornerUpLeft, Copy, CornerUpRight, Pin, Circle, Star, CheckSquare, Trash2 } from 'lucide-react';

const ContextMenu = ({ x, y, options, onClose }) => {
  const menuRef = useRef(null);
  const [pos, setPos] = useState({ top: y, left: x });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    if (menuRef.current) {
      const menuHeight = menuRef.current.offsetHeight;
      const windowHeight = window.innerHeight;
      if (y + menuHeight > windowHeight) {
        setPos({ top: y - menuHeight, left: x });
      } else {
        setPos({ top: y, left: x });
      }
    }
  }, [y, x]);

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] bg-white dark:bg-[#233138] shadow-2xl rounded-xl py-2 min-w-[220px] border dark:border-white/5 animate-fade-in"
      style={{ top: pos.top, left: pos.left }}
    >
      {options.map((option, index) => (
        <React.Fragment key={index}>
          {option.divider && <div className="h-[1px] bg-gray-100 dark:bg-white/5 my-1" />}
          <button
            onClick={() => {
              option.onClick();
              onClose();
            }}
            className={`w-full text-left px-4 py-2.5 text-[14.5px] hover:bg-gray-100 dark:hover:bg-white/5 transition-colors flex items-center justify-between group ${
              option.danger ? 'text-red-500' : 'text-[#3b4a54] dark:text-[#d1d7db]'
            }`}
          >
            <div className="flex items-center gap-4">
              {option.icon}
              <span>{option.label}</span>
            </div>
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

export default ContextMenu;

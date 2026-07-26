"use client";

import React, { useState, useEffect } from 'react';
import { FaArrowUp } from 'react-icons/fa6';

const ScrollToTop = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) setIsVisible(true);
            else setIsVisible(false);
        };
        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const handleScrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    return (
        <div className='fixed bottom-4 animate-pulse right-4 z-50'>
            {isVisible && (
                <button 
                    onClick={handleScrollToTop} 
                    className='text-white cursor-pointer rounded-xl w-11 h-11 flex items-center justify-center focus:outline-none transition-all duration-300 hover:brightness-125 shadow-lg'
                    style={{ backgroundColor: "var(--color-crimson-800)", border: "1px solid var(--color-glass-border)" }}
                >
                    <FaArrowUp />   
                </button>
            )}
        </div>
    );
};

export default ScrollToTop;

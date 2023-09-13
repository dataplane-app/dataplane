import React from 'react';

export function RunningSpinner() {
    return (
        <svg width="16" height="16" fill="none" className="anim-rotate" xmlns="http://www.w3.org/2000/svg">
            <path opacity=".5" d="M8 15A7 7 0 108 1a7 7 0 000 14v0z" stroke="#65BEFF" strokeWidth="2"></path>
            <path d="M15 8a7 7 0 01-7 7" stroke="#65BEFF" strokeWidth="2"></path>
            <path d="M8 12a4 4 0 100-8 4 4 0 000 8z" fill="#65BEFF  "></path>
        </svg>
    );
}

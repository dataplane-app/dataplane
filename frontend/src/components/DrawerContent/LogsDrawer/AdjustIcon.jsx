import { SvgIcon } from '@mui/material';
import React from 'react';

export function AdjustIcon() {
    return (
        <>
            <SvgIcon width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ width: 18 }}>
                <circle cx="6.5" cy="6.5" r="6.5" fill="#65BEFF" />
                <circle cx="6.5" cy="6.5" r="4.875" fill="#222222" />
                <circle cx="6.5" cy="6.5" r="2.4375" fill="#65BEFF" />
            </SvgIcon>
            <svg width="16" height="16" fill="none" className="anim-rotate" xmlns="http://www.w3.org/2000/svg">
                <path opacity=".5" d="M8 15A7 7 0 108 1a7 7 0 000 14v0z" stroke="#65BEFF    " stroke-width="2"></path>
                <path d="M15 8a7 7 0 01-7 7" stroke="#65BEFF    " stroke-width="2"></path>
                <path d="M8 12a4 4 0 100-8 4 4 0 000 8z" fill="#65BEFF  "></path>
            </svg>
        </>
    );
}

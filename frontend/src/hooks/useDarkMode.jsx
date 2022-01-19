import { useState, useEffect } from 'react';

function useSafeLocalStorage(key, initialValue) {
    const [valueProxy, setValueProxy] = useState(() => {
        try {
            const value = window.localStorage.getItem(key);
            return value ? JSON.parse(value) : initialValue;
        } catch {
            return initialValue;
        }
    });

    const setValue = (value) => {
        try {
            window.localStorage.setItem(key, value);
            setValueProxy(value);
        } catch {
            setValueProxy(value);
        }
    };

    return [valueProxy, setValue];
}

function usePrefersDarkMode() {
    const [value, setValue] = useState(true);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setValue(mediaQuery.matches);

        const handler = () => setValue(mediaQuery.matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    return value;
}

export function useDarkMode() {
    const prefersDarkMode = usePrefersDarkMode();
    const [isEnabled, setIsEnabled] = useSafeLocalStorage('theme', undefined);

    const enabled = isEnabled === undefined ? prefersDarkMode : isEnabled;
    console.log('THEME DARK: ', enabled);

    useEffect(() => {
        if (window === undefined) return;
        const root = window.document.documentElement;
        root.classList.remove(enabled ? 'light' : 'dark');
        root.classList.add(enabled ? 'dark' : 'light');
    }, [enabled]);

    return [enabled, setIsEnabled];
}

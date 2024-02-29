'use client';

import {ActionIcon, Button, Group, MantineColorScheme, useMantineColorScheme} from '@mantine/core';
import {useEffect, useState} from "react";
import {IconMoon, IconSun} from "@tabler/icons-react";
import {useLocalStorage} from "@mantine/hooks";

export function ColorSchemeToggle() {
    const [isLight, setIsLight] = useState(true);
    const { setColorScheme } = useMantineColorScheme();

    //@ts-ignore
    const [storedColorScheme, setStoredColorScheme] = useLocalStorage('colorScheme', 'light');

    useEffect(() => {
        setIsLight(storedColorScheme === 'light');
        setColorScheme(storedColorScheme as MantineColorScheme);
    }, [setColorScheme, storedColorScheme]);

    const handleColorSchemeChange = (scheme: string | ((prevState: string) => string)) => {
        setIsLight(scheme === 'light');
        setStoredColorScheme(scheme);
        setColorScheme(scheme as "light" | "dark");
    };

    return (
        <ActionIcon variant="transparent">
            {isLight ? (
                <IconMoon
                    color="black"
                    onClick={() => handleColorSchemeChange('dark')}
                />
            ) : (
                <IconSun
                    color="white"
                    onClick={() => handleColorSchemeChange('light')}
                />
            )}
        </ActionIcon>
    );
}

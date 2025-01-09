"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";

interface SettingsContextType {
    soundEnabled: boolean;
    toggleSound: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [soundEnabled, setSoundEnabled] = useState(true);

    useEffect(() => {
        // Load settings from localStorage
        const savedSettings = localStorage.getItem("app-settings");
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            setSoundEnabled(settings.soundEnabled ?? true);
        }
    }, []);

    const toggleSound = () => {
        setSoundEnabled((prev) => {
            const newValue = !prev;
            // Save to localStorage
            localStorage.setItem(
                "app-settings",
                JSON.stringify({ soundEnabled: newValue })
            );
            return newValue;
        });
    };

    return (
        <SettingsContext.Provider
            value={{
                soundEnabled,
                toggleSound,
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }
    return context;
} 
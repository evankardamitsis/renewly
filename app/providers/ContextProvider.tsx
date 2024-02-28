"use client";
import React from "react";
import { Toaster } from "react-hot-toast";
import {TasksProvider} from "@/app/providers/TasksProvider";

interface Props {
    children: React.ReactNode;
}

function ContextProvider({ children }: Props) {
    const [isReady, setIsReady] = React.useState(false);

    React.useEffect(() => {
        setTimeout(() => {
            setIsReady(true);
        }, 250);
    }, []);

    if (!isReady) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <span className="loader"></span>
            </div>
        );
    }

    return (
        <TasksProvider>
            <Toaster />
            {children}
        </TasksProvider>
    );
}

export default ContextProvider;

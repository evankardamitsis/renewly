'use client'

import {AppShell, Burger, Flex, Group, Skeleton, Text} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import React, {useEffect, useState} from "react";
import {ColorSchemeToggle} from "@/app/components/ColorSchemeToggle/ColorSchemeToggle";
import Sidebar from "@/app/components/Sidebar/Sidebar";
import {UserButton} from "@clerk/nextjs";

interface CustomLayoutProps {
    children?: React.ReactNode;
}

export const CustomLayout: React.FC<CustomLayoutProps> = ({ children }) => {
    const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
    const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);

    return (
        <AppShell
            header={{ height: 60}}
            navbar={{
                width: 300,
                breakpoint: 'sm',
                collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
            }}
            padding="md"
            withBorder={false}
        >
            <AppShell.Header>
                <Group h="100%" px="md" justify="space-between" align="center">
                    {/*//left aligned items*/}
                    <Flex gap="lg" align="center">
                        <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" />
                        <Burger opened={desktopOpened} onClick={toggleDesktop} visibleFrom="sm" size="sm" />
                        <Text fz={28} fw={600}>Renewly</Text>
                    </Flex>
                    {/*//right aligned items*/}
                    <Flex justify="flex-end" align="center" gap="lg">
                        <ColorSchemeToggle />
                        <UserButton />
                    </Flex>
                </Group>

            </AppShell.Header>
            <AppShell.Navbar p="md">
                <Sidebar />
            </AppShell.Navbar>
            <AppShell.Main className="w-full">
                {children}
            </AppShell.Main>
        </AppShell>
    );
}

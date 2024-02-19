'use client';

import React from 'react';
import {usePathname, useRouter} from "next/navigation";
import {ActionIcon, Flex, Stack, Text, Image, Title} from "@mantine/core";
import menu from "@/app/utils/menu";
import {UserButton} from "@clerk/nextjs";

const Sidebar = () => {

    const router = useRouter();
    const pathname = usePathname();

    const handleClick = (link: string) => {
        router.push(link);
    };

    return (
        <div className="w-[15rem] rounded-xl border border-amber-300 h-full p-4 shadow-xs">
            <Stack gap="lg">
                <Stack my="md">
                    <Flex gap="md" align="center">
                        <Flex>
                            <UserButton />
                        </Flex>
                        <Stack gap={1}>
                            <Title size="sm">John</Title>
                            <Title size="sm">Wrathmore</Title>
                        </Stack>
                    </Flex>
                </Stack>
                    <Stack>
                    {menu.map((item) => (
                    <Flex
                        key={item.id}
                        onClick={() => handleClick(item.link)}
                        gap="lg"
                        w="100%"
                        p={8}
                        h={40}
                        className={`cursor-pointer ${pathname === item.link ? "bg-amber-300 text-black" : ""} rounded-lg`}
                    >
                        <ActionIcon bg={"transparent"} c={`${pathname === item.link ? "red" : ""}`}>
                            {item.icon}
                        </ActionIcon>
                        <Text fw={500}>{item.title}</Text>
                    </Flex>
                ))}
            </Stack>
        </Stack>
        </div>
    );
};

export default Sidebar;

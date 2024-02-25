'use client';

import React from 'react';
import {usePathname, useRouter} from "next/navigation";
import {ActionIcon, Button, Flex, Stack, Text} from "@mantine/core";
import menu from "@/app/utils/menu";
import {useAuth, UserButton, useUser} from "@clerk/nextjs";
import {IconLogout} from "@tabler/icons-react";

const Sidebar = () => {

    const router = useRouter();
    const pathname = usePathname();

    const { user } = useUser();
    const { signOut } = useAuth();

    const firstName = user?.firstName;
    const lastName = user?.lastName;

    const handleClick = (link: string) => {
        router.push(link);
    };

    const handleSignOut = async () => {
        await signOut();
    };

    return (
        <div className="flex flex-col h-full w-[15rem] rounded-xl border border-amber-300 p-4 shadow-xs">
            <Stack gap="lg">
                <Stack my="md">
                    <Flex gap="md" align="center">
                        <Flex>
                            <UserButton />
                        </Flex>
                        <Text fz={16}>{firstName} {lastName}</Text>
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
            <Flex mt="auto">
                <Button
                    variant="transparent"
                    color="gray"
                    onClick={handleSignOut}
                    leftSection={<IconLogout />}
                >
                    Sign Out
                </Button>
            </Flex>
        </div>
    );
};

export default Sidebar;

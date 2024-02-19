'use client'

import React from 'react';
import {SignIn} from "@clerk/nextjs";
import {Stack} from "@mantine/core";

const Page = () => {
    return (
        <Stack justify="center" align="center" h="100vh">
            <SignIn />
        </Stack>
    );
};

export default Page;

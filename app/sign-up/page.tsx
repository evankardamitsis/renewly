'use client'

import React from 'react';
import {SignUp} from "@clerk/nextjs";
import {Stack} from "@mantine/core";

const Page = () => {
    return (
        <Stack justify="center" align="center" h="100vh">
            <SignUp />
        </Stack>
    );
};

export default Page;

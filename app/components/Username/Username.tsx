import React from 'react';
import {currentUser} from "@clerk/nextjs";
import {Stack, Title} from "@mantine/core";

const Username = async () => {
    const user = await currentUser();

    return (
        <Stack gap={4}>
            <Title fz={14}>{user?.firstName}</Title>
            <Title fz={14}>{user?.lastName}</Title>
        </Stack>
    );
};

export default Username;

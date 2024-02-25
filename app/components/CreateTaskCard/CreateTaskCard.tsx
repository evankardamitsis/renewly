import React from 'react';
import {Card, Button, Stack} from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';

const CreateTaskCard = () => {
    return (
        <Card
            radius="lg"
            shadow="xs"
            p="lg"
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', border: " 1px gray dashed"}}
            className="cursor-pointer"
        >
            <Stack gap="lg" justify="center" align="center">
                <IconPlus size={18} />
                    Create new Task
            </Stack>
        </Card>
    );
};

export default CreateTaskCard;

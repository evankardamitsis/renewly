import React, {useState} from 'react';
import {Card, Modal, Stack} from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import CreateContent from "@/app/components/Modals/CreateContent";

const CreateTaskCard = () => {
    const [opened, setOpened] = useState(false);

    return (
        <>
        <Card
            radius="lg"
            shadow="xs"
            p="lg"
            h={'auto'}
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', border: " 1px gray dashed"}}
            className="cursor-pointer"
            onClick={() => setOpened(true)}
        >
            <Stack gap="lg" justify="center" align="center">
                <IconPlus size={18} />
                    Create new Task
            </Stack>

        </Card>
        <Modal
            opened={opened}
            onClose={() => setOpened(false)}
            radius="md"
            overlayProps={{
                backgroundOpacity: 0.55,
                blur: 2,
            }}
        >
            <CreateContent onClose={() => setOpened(false)} />
        </Modal>
        </>
    );
};

export default CreateTaskCard;

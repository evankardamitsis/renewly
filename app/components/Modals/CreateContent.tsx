'use client'

import React, {useState} from 'react';
import {Button, Checkbox, Stack, TextInput, Title} from "@mantine/core";
import {useForm} from "@mantine/form";
import {DateInput} from "@mantine/dates";
import axios from "axios";
import toast from "react-hot-toast";
import {useTasks} from "@/app/providers/TasksProvider";

interface Props {
    onClose: () => void;
}

const CreateContent = ({onClose}: Props) => {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [date, setDate] = useState<Date | null>(null)
    const [completed, setCompleted] = useState(false)
    const [important, setImportant] = useState(false)

    const { allTasks } = useTasks();


    const form = useForm({
        initialValues: {
            title: '',
            description: '',
            date: '',
            completed: false,
            important: false,
        },

        validate: {
            title: (value) => value.length < 3 && 'Title must be at least 3 characters',
        },
    });

    const handleChange = (name:string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        switch (name) {
            case 'title':
                setTitle(e.target.value)
                break;
            case 'description':
                setDescription(e.target.value)
                break;
            case 'date':
                setDate(new Date(e.target.value))
                break;
            case 'completed':
                setCompleted(e.target.checked)
                break;
            case 'important':
                setImportant(e.target.checked)
                break;
            default:
                break;
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        const task = {
            title,
            description,
            date,
            completed,
            important
        }

        try {
            const res = await axios.post('/api/tasks', task)
            if(res.data.error){
                toast.error(res.data.error)
            }

            toast.success('Task created successfully')
            await allTasks();
            onClose();
        } catch (error) {
            toast.error('Error creating task');
            console.log('error creating task', error)
        }
    }

    return (
        <Stack>
            <Title order={3}>Create a task</Title>
            <form onSubmit={handleSubmit}>
                <Stack w={400} my="xl" gap="lg">
                    <TextInput
                        placeholder="Title"
                        value={title}
                       onChange={handleChange('title')}
                    />
                    <TextInput
                        placeholder="Description"
                        value={description}
                        onChange={handleChange('description')}
                    />
                    <DateInput
                        placeholder="Date"
                        value={date}
                        onChange={setDate}
                    />
                    <Checkbox
                        label={"Completed"}
                        value={completed.toString()}
                        checked={completed}
                        onChange={handleChange('completed')}
                    />
                    <Checkbox
                        label={"Important"}
                        value={important.toString()}
                        checked={important}
                        onChange={handleChange('important')}
                    />
                    <Button type="submit">Create Task</Button>
                </Stack>
            </form>
        </Stack>
);
};

export default CreateContent;

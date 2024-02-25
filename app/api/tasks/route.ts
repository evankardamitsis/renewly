import {NextResponse} from "next/server";
import {auth} from "@clerk/nextjs";
import prisma from "@/app/utils/connect";

export async function POST(req: Request) {
    try {
        const {userId} = auth()

        if(!userId) {
            return NextResponse.json({error: 'user not authenticated'}, {status: 401});
        }

        const {title, description, date, completed, important} = await req.json();


        if(!title || !description || !date) {
            return NextResponse.json({error: 'missing required fields'}, {status: 400});
        }

        if(title.length < 3 ) {
            return NextResponse.json({error: 'title must be at least 3 characters'}, {status: 400});
        }

        const task = await prisma.task.create({
            data: {
                title,
                description,
                date,
                isCompleted: completed,
                isImportant: important,
                userId
            }
        });

       return NextResponse.json(task);
    } catch (error) {
        console.log('error creating task', error);
        return  NextResponse.json({error: 'error creating task'}, {status: 500});
    }
}

export async function GET(req: Request) {
    try {
        const {userId} = auth()

        if(!userId) {
            return NextResponse.json({error: 'user not authenticated'}, {status: 401});
        }

        const tasks = await prisma.task.findMany({
            where: {
                userId
            }
        });

        return NextResponse.json(tasks);

    } catch (error) {
        console.log('error getting tasks', error);
        return  NextResponse.json({error: 'error getting tasks'}, {status: 500});
    }
}

export async function PUT(req: Request) {
    try {

    } catch (error) {
        console.log('error updating task', error);
        return  NextResponse.json({error: 'error updating task'}, {status: 500});
    }
}

export async function DELETE(req: Request) {
    try {

    } catch (error) {
        console.log('error deleting task', error);
        return  NextResponse.json({error: 'error deleting task'}, {status: 500});
    }
}





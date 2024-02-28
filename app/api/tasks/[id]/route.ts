import {NextResponse} from "next/server";
import {auth} from "@clerk/nextjs";
import prisma from "@/app/utils/connect";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const {userId} = auth()
        const {id} = params;
        const {isCompleted} = await req.json();


        if(!userId) {
            return NextResponse.json({error: 'user not authenticated'}, {status: 401});
        }

       const task = await prisma.task.update({
            where: {
                id
            },
            data: {
                isCompleted
            }
        });

        return NextResponse.json(task);

       } catch (error) {
        console.log('error updating task', error);
        return  NextResponse.json({error: 'error updating task'}, {status: 500});
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const {userId} = auth()
        const {id} = params;

        if(!userId) {
            return NextResponse.json({error: 'user not authenticated'}, {status: 401});
        }

        const task = await prisma.task.delete({
            where: {
                id
            }
        });

        return NextResponse.json(task);
    } catch (error) {
        console.log('error deleting task', error);
        return  NextResponse.json({error: 'error deleting task'}, {status: 500});
    }
}

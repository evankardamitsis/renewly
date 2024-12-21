import { Project, Task } from "@/types/database";

const FUNCTION_BASE_URL = "/api/edge";

interface ApiResponse<T> {
    data?: T;
    error?: string;
}

async function fetchEdgeFunction<T>(
    functionName: string,
    payload: unknown,
): Promise<T> {
    const response = await fetch(`${FUNCTION_BASE_URL}/${functionName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const result: ApiResponse<T> = await response.json();

    if (!response.ok || result.error) {
        throw new Error(result.error || "An error occurred");
    }

    return result.data as T;
}

export const edgeApi = {
    createProject: (payload: CreateProjectInput) =>
        fetchEdgeFunction<Project>("create-project", payload),

    createTask: (payload: CreateTaskInput) =>
        fetchEdgeFunction<Task>("create-task", payload),

    createTeam: (payload: CreateTeamInput) =>
        fetchEdgeFunction<Team>("create-team", payload),
};

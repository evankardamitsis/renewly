import {IconClipboardCheck, IconClipboardX, IconDashboard, IconRadioactiveFilled} from "@tabler/icons-react";


const Tasksmenu = [
    {
        id: 1,
        title: "All Tasks",
        icon: <IconDashboard />,
        link: "/dashboard/tasks/all",
    },
    {
        id: 2,
        title: "Important",
        icon: <IconRadioactiveFilled />,
        link: "/dashboard/tasks/important",
    },
    {
        id: 3,
        title: "Completed",
        icon: <IconClipboardCheck />,
        link: "/dashboard/tasks/completed",
    },
    {
        id: 4,
        title: "Pending",
        icon: <IconClipboardX />,
        link: "/dashboard/tasks/pending",
    },
];

export default Tasksmenu;

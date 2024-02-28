import {IconClipboardCheck, IconClipboardX, IconDashboard, IconRadioactiveFilled} from "@tabler/icons-react";


const menu = [
    {
        id: 1,
        title: "All Tasks",
        icon: <IconDashboard />,
        link: "/",
    },
    {
        id: 2,
        title: "Important",
        icon: <IconRadioactiveFilled />,
        link: "/important",
    },
    {
        id: 3,
        title: "Completed",
        icon: <IconClipboardCheck />,
        link: "/completed",
    },
    {
        id: 4,
        title: "Pending",
        icon: <IconClipboardX />,
        link: "/pending",
    },
];

export default menu;

import dayjs from 'dayjs';

export const formatDate = (date: string | number | Date | dayjs.Dayjs | null | undefined, format = 'MMMM D, YYYY') => {
    return dayjs(date).format(format);
};

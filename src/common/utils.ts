import dayjs from "@/Utils/dayjs";

const DATE_FORMAT = "MMM DD, YYYY";
const TIME_FORMAT = "hh:mm A";
const DATE_TIME_FORMAT = `${DATE_FORMAT}, ${TIME_FORMAT}`;

type DateLike = Parameters<typeof dayjs>[0];
export const formatDateTime = (date: DateLike, format?: string) => {
  const obj = dayjs(date);

  if (format) {
    return obj.format(format);
  }

  if (obj.isSame(obj.startOf("day"))) {
    return obj.format(DATE_FORMAT);
  }

  return obj.format(DATE_TIME_FORMAT);
};

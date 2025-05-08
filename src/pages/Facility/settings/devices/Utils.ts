export const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800 hover:bg-green-100/80";
    case "inactive":
      return "bg-gray-100 text-gray-800 hover:bg-gray-100/80";
    case "entered_in_error":
      return "bg-red-100 text-red-800 hover:bg-red-100/80";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100/80";
  }
};

export const getAvailabilityStatusColor = (status: string) => {
  switch (status) {
    case "available":
      return "bg-green-100 text-green-800 hover:bg-green-100/80";
    case "lost":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80";
    case "damaged":
    case "destroyed":
      return "bg-red-100 text-red-800 hover:bg-red-100/80";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100/80";
  }
};

export const users = {
  districtAdmin: { username: "devdistrictadmin", password: "Coronasafe@123" },
  devDoctor: { username: "devdoctor", password: "Coronasafe@123" },
  staff: { username: "staffdev", password: "Coronasafe@123" },
  nurse: { username: "dummynurse1", password: "Coronasafe@123" },
};

export const nonAdminRoles = ["devDoctor", "staff", "nurse"] as const;

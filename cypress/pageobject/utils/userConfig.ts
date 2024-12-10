export const users = {
  districtAdmin: { username: "devdistrictadmin", password: "Coronasafe@123" },
  devDoctor: { username: "devdoctor", password: "Coronasafe@123" },
  nurse: { username: "dummynurse1", password: "Coronasafe@123" },
  nurse2: { username: "dummynurse2", password: "Coronasafe@123" },
};

export const nonAdminRoles = ["devDoctor", "nurse"] as const;

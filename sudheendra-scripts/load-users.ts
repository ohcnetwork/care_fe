import { GENDERS } from "@/common/constants";
import { UserRead } from "@/types/user/user";
import {
  fetchCsvFromGoogleSheet,
  getLogger,
  request,
  transformCsvToObjects,
} from "./utils";

const getConfig = () => {
  const googleSheetId = process.env.DEPARTMENT_USERS_SHEET_ID!;
  if (!googleSheetId) {
    throw new Error("DEPARTMENT_USERS_SHEET_ID is not set");
  }

  const sheetName = process.env.DEPARTMENT_USERS_SHEET_NAME!;
  if (!sheetName) {
    throw new Error("DEPARTMENT_USERS_SHEET_NAME is not set");
  }
  const facilityId = process.env.FACILITY_ID!;
  if (!facilityId) {
    throw new Error("FACILITY_ID is not set");
  }
  const roleId = process.env.ROLE_ID!;
  if (!roleId) {
    throw new Error("ROLE_ID is not set");
  }
  const organizationId = process.env.ORGANIZATION_ID!;
  if (!organizationId) {
    throw new Error("ORGANIZATION_ID is not set");
  }

  return { googleSheetId, sheetName, facilityId, roleId, organizationId };
};

const headerMap = {
  firstName: 0,
  lastName: 1,
  email: 2,
  phoneNumber: 3,
  gender: 4,
  passWord: 5,
};

const requiredHeaderKeys = [
  "firstName",
  "lastName",
  "email",
  "phoneNumber",
  "gender",
  "passWord",
] as const;

const logger = getLogger();

async function main() {
  const { googleSheetId, sheetName, facilityId, roleId, organizationId } =
    getConfig();
  const csvData = await fetchCsvFromGoogleSheet(googleSheetId, sheetName);
  const datapoints = transformCsvToObjects(csvData, headerMap).map(
    getValidatedDatapoint,
  );

  await createDepartmentUsers(datapoints, facilityId, roleId, organizationId);
}

const getValidatedDatapoint = (
  datapoint: Record<keyof typeof headerMap, string>,
) => {
  if (requiredHeaderKeys.some((key) => !datapoint[key].trim())) {
    throw new Error(
      `Missing required header in datapoint ${JSON.stringify(datapoint)}`,
    );
  }

  const gender = GENDERS.find(
    (gender) => gender === datapoint.gender.toLowerCase(),
  );
  if (!gender) {
    throw new Error(`Invalid gender: ${datapoint.gender.toLowerCase()}`);
  }

  const userName = `${datapoint.firstName.toLowerCase()}_${datapoint.lastName.toLowerCase()}`;

  return {
    ...datapoint,
    gender,
    userName,
  };
};

async function createDepartmentUsers(
  datapoints: ReturnType<typeof getValidatedDatapoint>[],
  facilityId: string,
  roleId: string,
  organizationId: string,
) {
  for (const datapoint of datapoints) {
    const existingUser = await request<UserRead>(
      `/api/v1/users/${datapoint.userName}/`,
      "GET",
    );
    if (existingUser) {
      logger(`User ${datapoint.userName} already exists`);
      continue;
    }
    const newUser = await request<UserRead>("/api/v1/users/", "POST", {
      user_type: "administrator",
      username: datapoint.userName,
      email: datapoint.email,
      first_name: datapoint.firstName,
      last_name: datapoint.lastName,
      gender: datapoint.gender,
      password: datapoint.passWord,
      phone_number: datapoint.phoneNumber,
    });
    if (!newUser) {
      logger(`Failed to create user ${datapoint.userName}`);
      continue;
    }
    logger(`Created user ${datapoint.userName}`);
    // await request(
    //   `/api/v1/facility/${facilityId}/organizations/${organizationId}/users/`,
    //   "POST",
    //   {
    //     user: newUser.id,
    //     role: roleId,
    //   },
    // );
    // logger(
    //   `Added user ${datapoint.userName} to organization ${organizationId}`,
    // );
  }
}

main();

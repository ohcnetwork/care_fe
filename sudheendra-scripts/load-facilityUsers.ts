import { getExistingUsers } from "sudheendra-scripts/inventory-from-db/utils";
import {
  fetchCsvFromGoogleSheet,
  getLogger,
  request,
  transformCsvToObjects,
} from "./utils";

const getConfig = () => {
  const departmentUsersSheetId = process.env.DEPARTMENT_USERS_SHEET_ID!;
  if (!departmentUsersSheetId) {
    throw new Error("DEPARTMENT_USERS_SHEET_ID is not set");
  }
  const departmentUsersSheetName = process.env.DEPARTMENT_USERS_SHEET_NAME!;
  if (!departmentUsersSheetName) {
    throw new Error("DEPARTMENT_USERS_SHEET_NAME is not set");
  }

  const facilityId = process.env.FACILITY_ID!;
  if (!facilityId) {
    throw new Error("FACILITY_ID is not set");
  }
  return { departmentUsersSheetId, departmentUsersSheetName, facilityId };
};

const headerMap = {
  username: 0,
  organizationId: 1,
  roleId: 2,
};

const logger = getLogger();

async function linkFacilityUsers(
  datapoints: Record<keyof typeof headerMap, string>[],
  facilityId: string,
) {
  const existingUsers = await getExistingUsers();
  for (const datapoint of datapoints) {
    const { username, organizationId, roleId } = datapoint;

    try {
      await request(
        `/api/v1/facility/${facilityId}/organizations/${organizationId}/users/`,
        "POST",
        {
          user: username,
          role: roleId,
        },
      );
      logger(
        `Link user ${username} to organization ${organizationId} with role ${roleId}`,
      );
    } catch (error: any) {
      if (error.message.includes("User association already exists")) {
        const user = existingUsers.get(username);
        if (!user) {
          logger(`User ${username} not found`);
          continue;
        }
        await request(
          `/api/v1/facility/${facilityId}/organizations/${organizationId}/users/${user.id}/`,
          "PUT",
          {
            role: roleId,
          },
        );
        logger(
          `Update role of user ${username} in organization ${organizationId} to ${roleId}`,
        );
      } else {
        throw error;
      }
    }
  }
}

async function main() {
  const { departmentUsersSheetId, departmentUsersSheetName, facilityId } =
    getConfig();
  const csvData = await fetchCsvFromGoogleSheet(
    departmentUsersSheetId,
    departmentUsersSheetName,
  );
  const datapoints = transformCsvToObjects(csvData, headerMap);
  await linkFacilityUsers(datapoints, facilityId);
}

main();

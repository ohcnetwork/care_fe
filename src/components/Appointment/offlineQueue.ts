import { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { AppCacheDB, OfflineWritesEntry } from "@/OfflineSupport/AppcacheDB";
import { OfflineKeyMap, PathParamsObject } from "@/OfflineSupport/offlineKeys";
import {
  isOfflineId,
  normalizeUserBase,
  normalizedAppointmentRecord,
  saveOfflineWrite,
  saveOfflineWriteData,
  updateSlotCacheAfterOfflineAppointment,
} from "@/OfflineSupport/offlineWriteHelpers";
import { PaginatedResponse } from "@/Utils/request/types";
import { getMonthFromDate } from "@/Utils/utils";
import { PatientRead } from "@/types/emr/patient/patient";
import { TagConfig } from "@/types/emr/tagConfig/tagConfig";
import { FacilityRead } from "@/types/facility/facility";
import {
  Appointment,
  AppointmentCancelRequest,
  AppointmentCancelledStatus,
  AppointmentCreateRequest,
  AppointmentNonCancelledStatus,
  AppointmentRescheduleRequest,
  AppointmentUpdateRequest,
  TokenSlot,
} from "@/types/scheduling/schedule";
import scheduleApis from "@/types/scheduling/scheduleApi";
import { CurrentUserRead, UserReadMinimal } from "@/types/user/user";

interface NormalizeAndSetQueryDataParams {
  entry: any;
  patientData: PatientRead;
  queryClient: QueryClient;
  authUser: CurrentUserRead;
  selectedSlot: TokenSlot | undefined;
  selectedPracticioner: UserReadMinimal | null;
  status: AppointmentNonCancelledStatus;
  selectedTags: TagConfig[];
  facilityId: string;
  patientId: string;
}

interface QueueAppointmentRecordOfflineParams {
  createAppointmentData: AppointmentCreateRequest;
  selectedSlot: TokenSlot | undefined;
  selectedPracticioner: UserReadMinimal | null;
  authUser: CurrentUserRead;
  status: AppointmentNonCancelledStatus;
  facilityId: string;
  patientId: string;
  selectedSlotId: string | undefined;
  selectedTags: TagConfig[];
  selectedDateOffline: Date;
  selectedMonthOffline: Date;
  queryClient: QueryClient;
  db: AppCacheDB;
  t: (key: string) => string;
  onSuccess?: (
    appointmentId: string,
    normalizedAppointment: Appointment,
  ) => void;
  onError?: (error: Error) => void;
}

interface QueueRescheduleOfflineRecordParams {
  rescheduleAppointmentData: AppointmentRescheduleRequest;
  selectedSlot: TokenSlot | undefined;
  selectedPracticioner: UserReadMinimal;
  authUser: CurrentUserRead;
  appointment: Appointment;
  db: AppCacheDB;
  facilityId: string;
  queryClient: QueryClient;
  t: (key: string) => string;
  selectedDateOffline: Date;
  selectedMonthOffline: Date;
  onSuccess?: (
    appointmentId: string,
    normalizedAppointment: Appointment,
  ) => void;
  onError?: (error: Error) => void;
}

interface NormalizeAndSetQueryDataForRescheduleParams {
  entry: any;
  appointment: Appointment;
  queryClient: QueryClient;
  authUser: CurrentUserRead;
  selectedSlot: TokenSlot | undefined;
  selectedPracticioner: UserReadMinimal;
  rescheduleAppointmentData: AppointmentRescheduleRequest;
  facilityId: string;
  selectedDateOffline: Date;
  selectedMonthOffline: Date;
  db: AppCacheDB;
}

interface QueueUpdateAppointmentRecordOfflineParams {
  updateAppointmentData: AppointmentUpdateRequest;
  appointment: Appointment;
  authUser: CurrentUserRead;
  status: AppointmentNonCancelledStatus;
  facilityId: string;
  queryClient: QueryClient;
  t: (key: string) => string;
  db: AppCacheDB;
  onSuccess?: (
    appointmentId: string,
    normalizedAppointment: Appointment,
  ) => void;
  onError?: (error: Error) => void;
}

interface QueueCancelAppointmentRecordParams {
  cancelAppointmentData: AppointmentCancelRequest;
  appointment: Appointment;
  authUser: CurrentUserRead;
  status: AppointmentCancelledStatus;
  facilityId: string;
  queryClient: QueryClient;
  t: (key: string) => string;
  db: AppCacheDB;
  onSuccess?: (
    appointmentId: string,
    normalizedAppointment: Appointment,
  ) => void;
  onError?: (error: Error) => void;
}

const normalizeAndSetQueryDataForNewAppointment = async ({
  entry,
  patientData,
  queryClient,
  authUser,
  selectedSlot,
  selectedPracticioner,
  status,
  selectedTags,
  facilityId,
  patientId,
  selectedDateOffline,
  selectedMonthOffline,
}: NormalizeAndSetQueryDataParams & {
  selectedDateOffline: Date;
  selectedMonthOffline: Date;
}): Promise<Appointment> => {
  if (!selectedSlot || !selectedPracticioner) {
    throw new Error("Missing required data for appointment normalization");
  }

  const facilityData = queryClient.getQueryData<FacilityRead>([
    "facility",
    facilityId,
  ]);

  const FacilityBareMinimumData = {
    id: facilityData?.id ?? "-",
    name: facilityData?.name ?? "-",
  };

  const normalizeAppointment = normalizedAppointmentRecord(
    entry,
    selectedSlot,
    patientData,
    authUser,
    status,
    selectedPracticioner,
    FacilityBareMinimumData,
    selectedTags,
  );

  const db = new AppCacheDB();
  await db.OfflineWrites.update(entry.id, {
    normalizedData: normalizeAppointment,
  });

  queryClient.setQueryData(
    ["appointment", normalizeAppointment.id],
    normalizeAppointment,
  );

  updateSlotCacheAfterOfflineAppointment({
    queryClient: queryClient,
    selectedSlot: selectedSlot,
    selectedPracticioner: selectedPracticioner,
    facilityId: facilityId,
    selectedDate: selectedDateOffline,
    selectedMonth: selectedMonthOffline,
    action: "booked",
  });

  const appointmentListKey = ["patient-appointments", patientId];

  const prevAppointmentList =
    queryClient.getQueryData<PaginatedResponse<Appointment>>(
      appointmentListKey,
    );

  const updatedList: PaginatedResponse<Appointment> = prevAppointmentList
    ? {
        ...prevAppointmentList,
        count: prevAppointmentList.count + 1,
        results: [normalizeAppointment, ...prevAppointmentList.results],
      }
    : {
        count: 1,
        results: [normalizeAppointment],
      };

  queryClient.setQueryData(appointmentListKey, updatedList);

  return normalizeAppointment;
};

const normalizeAndSetQueryDataForReschedule = async ({
  entry,
  appointment,
  queryClient,
  authUser,
  selectedSlot,
  selectedPracticioner,
  rescheduleAppointmentData: _rescheduleAppointmentData,
  facilityId: _facilityId,
  selectedDateOffline,
  selectedMonthOffline,
  db,
}: NormalizeAndSetQueryDataForRescheduleParams): Promise<Appointment> => {
  if (!selectedSlot || !selectedPracticioner) {
    throw new Error("Missing required data for appointment rescheduling");
  }

  const updatedAppointment: Appointment = {
    ...appointment,
    token_slot: selectedSlot,
    user: selectedPracticioner,
    status: "booked" as AppointmentNonCancelledStatus,
    booked_on: new Date().toISOString(),
    booked_by: {
      ...normalizeUserBase(authUser),
      last_login: authUser?.last_login ?? "",
      profile_picture_url: authUser?.profile_picture_url ?? "",
      mfa_enabled: false,
      deleted: false,
    },
    is_updated_offline: true,
  };

  // Update the offline write entry with normalized data
  await db.OfflineWrites.update(entry.id, {
    normalizedData: updatedAppointment,
  });

  // Update patient appointments list cache
  const prevAppointmentList = queryClient.getQueryData<
    PaginatedResponse<Appointment>
  >(["patient-appointments", appointment.patient.id]);

  if (prevAppointmentList?.results?.length) {
    const updatedAppointmentList = {
      ...prevAppointmentList,
      results: prevAppointmentList.results.map((entry) =>
        entry.id === appointment.id ? updatedAppointment : entry,
      ),
    };

    queryClient.setQueryData(
      ["patient-appointments", appointment.patient.id],
      updatedAppointmentList,
    );
  }

  // Update slot cache
  updateSlotCacheAfterOfflineAppointment({
    queryClient: queryClient,
    selectedSlot: selectedSlot,
    selectedPracticioner: selectedPracticioner,
    facilityId: appointment.facility.id,
    selectedDate: selectedDateOffline,
    selectedMonth: selectedMonthOffline,
    action: "rescheduled",
    previousSlot: appointment.token_slot,
    previousDate: new Date(appointment.token_slot.start_datetime),
    previousMonth: getMonthFromDate(appointment.token_slot.start_datetime),
  });

  // Update individual appointment cache
  queryClient.setQueryData(["appointment", appointment.id], updatedAppointment);

  return updatedAppointment;
};

const normalizeAndSetQueryDataForUpdate = async ({
  entry,
  appointment,
  queryClient,
  authUser: _authUser,
  status,
  facilityId: _facilityId,
  db,
}: {
  entry: any;
  appointment: Appointment;
  queryClient: QueryClient;
  authUser: CurrentUserRead;
  status: AppointmentNonCancelledStatus;
  facilityId: string;
  db: AppCacheDB;
}): Promise<Appointment> => {
  const updatedAppointment = {
    ...appointment,
    status,
    is_updated_offline: true,
  };

  // Update the offline write entry with normalized data
  await db.OfflineWrites.update(entry.id, {
    normalizedData: updatedAppointment,
  });

  // Update individual appointment cache
  queryClient.setQueryData(["appointment", appointment.id], updatedAppointment);

  // Update patient appointments list cache
  const prevAppointmentList = queryClient.getQueryData<
    PaginatedResponse<Appointment>
  >(["patient-appointments", appointment.patient.id]);

  if (prevAppointmentList?.results?.length) {
    const updatedAppointmentList = {
      ...prevAppointmentList,
      results: prevAppointmentList.results.map((entry) =>
        entry.id === appointment.id ? updatedAppointment : entry,
      ),
    };

    queryClient.setQueryData(
      ["patient-appointments", appointment.patient.id],
      updatedAppointmentList,
    );
  }

  return updatedAppointment;
};

const normalizeAndSetQueryDataForCancel = async ({
  entry,
  appointment,
  queryClient,
  authUser: _authUser,
  status,
  facilityId: _facilityId,
  db,
  prevTokenSlot,
  prevDate,
  prevMonth,
}: {
  entry: any;
  appointment: Appointment;
  queryClient: QueryClient;
  authUser: CurrentUserRead;
  status: AppointmentCancelledStatus;
  facilityId: string;
  db: AppCacheDB;
  prevTokenSlot: TokenSlot;
  prevDate: Date;
  prevMonth: Date;
}): Promise<Appointment> => {
  const updatedAppointment: Appointment = {
    ...appointment,
    status: status as any, // Type assertion to handle the status type mismatch
    is_updated_offline: true,
  };

  // Update the offline write entry with normalized data
  if (entry.id) {
    await db.OfflineWrites.update(entry.id, {
      normalizedData: updatedAppointment,
    });
  }

  // Update individual appointment cache
  queryClient.setQueryData(["appointment", appointment.id], updatedAppointment);

  // Update patient appointments list cache
  const prevAppointmentList = queryClient.getQueryData<
    PaginatedResponse<Appointment>
  >(["patient-appointments", appointment.patient.id]);

  if (prevAppointmentList?.results?.length) {
    const updatedAppointmentList = {
      ...prevAppointmentList,
      results: prevAppointmentList.results.map((entry) =>
        entry.id === appointment.id ? updatedAppointment : entry,
      ),
    };

    queryClient.setQueryData(
      ["patient-appointments", appointment.patient.id],
      updatedAppointmentList,
    );
  }

  // Update slot cache
  updateSlotCacheAfterOfflineAppointment({
    queryClient: queryClient,
    selectedPracticioner: appointment.user,
    facilityId: appointment.facility.id,
    action: "cancel",
    previousSlot: prevTokenSlot,
    previousDate: prevDate,
    previousMonth: prevMonth,
  });

  return updatedAppointment;
};

export const queueNewAppointmentOffline = async ({
  createAppointmentData,
  selectedSlot,
  selectedPracticioner,
  authUser,
  status,
  facilityId,
  patientId,
  selectedSlotId,
  selectedTags,
  selectedDateOffline,
  selectedMonthOffline,
  queryClient,
  db: _db,
  t,
  onSuccess,
  onError,
}: QueueAppointmentRecordOfflineParams): Promise<void> => {
  if (!selectedSlot) {
    toast.error(t("slot_is_not_selected"));
    return;
  }
  if (!selectedPracticioner) {
    toast.error(t("practicioner_is_not_selected"));
    return;
  }
  try {
    const generatedId = `offline-${crypto.randomUUID()}`;
    const offlineEntry: saveOfflineWriteData = {
      id: generatedId,
      userId: authUser?.id,
      facilityId: facilityId,
      mutationSyncRouteKey: OfflineKeyMap.create_appointment,
      mutationPathParams: {
        facilityId,
        slotId: selectedSlotId ?? "",
      } satisfies PathParamsObject<typeof scheduleApis.slots.createAppointment>,
      type: OfflineKeyMap.create_appointment,
      resourceType: "Appointment",
      payload: createAppointmentData,
      parentMutationId: patientId?.startsWith("offline-")
        ? patientId
        : undefined,
    };

    const saveResult = await saveOfflineWrite(offlineEntry);

    if (!saveResult.success) {
      const error = new Error(saveResult.error);
      onError?.(error);
      return;
    }

    const Patientdata = queryClient.getQueryData<PatientRead>([
      "patient",
      patientId,
    ]);

    if (!Patientdata) {
      const error = new Error(t("appointment_display_failed_missing_patient"));
      onError?.(error);
      return;
    }

    const normalizedAppointment =
      await normalizeAndSetQueryDataForNewAppointment({
        entry: saveResult.entry,
        patientData: Patientdata,
        queryClient,
        authUser,
        selectedSlot,
        selectedPracticioner,
        status,
        selectedTags,
        facilityId,
        patientId,
        selectedDateOffline,
        selectedMonthOffline,
      });

    // Call success callback with the generated ID and normalized appointment
    onSuccess?.(generatedId, normalizedAppointment);
  } catch (error) {
    console.error("Error while scheduling appointment", error);
    toast.error(t("unexpected_error_while_booking_appointment"));
  }
};

export const queueRescheduleOfflineRecord = async ({
  rescheduleAppointmentData,
  selectedSlot,
  selectedPracticioner,
  authUser,
  appointment,
  db,
  facilityId,
  queryClient,
  t,
  selectedDateOffline,
  selectedMonthOffline,
  onSuccess,
  onError,
}: QueueRescheduleOfflineRecordParams): Promise<void> => {
  if (!selectedSlot) {
    const error = new Error(t("slot_is_not_selected"));
    onError?.(error);
    return;
  }
  if (!selectedPracticioner) {
    const error = new Error(t("practicioner_is_not_selected"));
    onError?.(error);
    return;
  }
  try {
    const rescheduleID = isOfflineId(appointment.id)
      ? `${appointment.id}-reschedule`
      : `offline-${appointment.id}-reschedule`;
    const rescheduleEntryExist = await db.OfflineWrites.get(rescheduleID);
    const createAppointmentExist = await db.OfflineWrites.get(appointment.id);

    if (
      createAppointmentExist &&
      createAppointmentExist.type === OfflineKeyMap.create_appointment
    ) {
      const updateEntry: OfflineWritesEntry = {
        ...createAppointmentExist,
        mutationPathParams: {
          facilityId: facilityId,
          slotId: rescheduleAppointmentData.new_slot,
        } satisfies PathParamsObject<
          typeof scheduleApis.slots.createAppointment
        >,
      };

      await db.OfflineWrites.update(createAppointmentExist.id, updateEntry);
    } else if (
      rescheduleEntryExist &&
      rescheduleEntryExist.type === OfflineKeyMap.reschedule_appointment
    ) {
      const updateEntry: OfflineWritesEntry = {
        ...rescheduleEntryExist,
        payload: rescheduleAppointmentData,
      };

      await db.OfflineWrites.update(rescheduleEntryExist.id, updateEntry);
    } else {
      const offlineEntry: saveOfflineWriteData = {
        id: rescheduleID,
        userId: authUser?.id,
        facilityId: facilityId,
        mutationSyncRouteKey: OfflineKeyMap.reschedule_appointment,
        mutationPathParams: {
          facilityId,
          id: appointment.id,
        } satisfies PathParamsObject<
          typeof scheduleApis.appointments.reschedule
        >,
        type: OfflineKeyMap.reschedule_appointment,
        resourceType: "Appointment",
        payload: rescheduleAppointmentData,
        serverTimestamp: appointment.modified_date,
        useQueryRouteKey: "retrieveAppointment",
        useQueryPathParams: {
          facility_id: appointment.facility.id,
          id: appointment.id,
        },
      };

      const saveResult = await saveOfflineWrite(offlineEntry);

      if (!saveResult.success) {
        const error = new Error(saveResult.error);
        onError?.(error);
        return;
      }

      const normalizedAppointment = await normalizeAndSetQueryDataForReschedule(
        {
          entry: saveResult.entry,
          appointment,
          queryClient,
          authUser,
          selectedSlot,
          selectedPracticioner,
          rescheduleAppointmentData,
          facilityId,
          selectedDateOffline,
          selectedMonthOffline,
          db,
        },
      );

      // Call success callback
      onSuccess?.(appointment.id, normalizedAppointment);
    }

    const statusUpdateId = isOfflineId(appointment.id)
      ? `${appointment.id}-statusUpdate`
      : `offline-${appointment.id}-statusUpdate`;

    const existingStatusEntry = await db.OfflineWrites.get(statusUpdateId);

    if (
      existingStatusEntry &&
      existingStatusEntry.type === OfflineKeyMap.update_appointment_status
    ) {
      await db.OfflineWrites.delete(statusUpdateId);
    }
  } catch (error) {
    const errorObj =
      error instanceof Error ? error : new Error("Unknown error occurred");
    onError?.(errorObj);
  }
};

export const queueUpdateAppointmentRecordOffline = async ({
  updateAppointmentData,
  appointment,
  authUser,
  status,
  facilityId,
  queryClient,
  t: _t,
  db,
  onSuccess,
  onError,
}: QueueUpdateAppointmentRecordOfflineParams): Promise<void> => {
  const statusupdateId = isOfflineId(appointment.id)
    ? `${appointment.id}-statusUpdate`
    : `offline-${appointment.id}-statusUpdate`;

  const rescheduleId = isOfflineId(appointment.id)
    ? `${appointment.id}-reschedule`
    : `offline-${appointment.id}-reschedule`;

  const existingStatusEntry = await db.OfflineWrites.get(statusupdateId);
  const existingRescheduleEntry = await db.OfflineWrites.get(rescheduleId);

  const baseEntry = {
    id: statusupdateId,
    userId: authUser.id,
    facilityId: facilityId,
    mutationSyncRouteKey: OfflineKeyMap.update_appointment_status,
    mutationPathParams: {
      facilityId,
      id: appointment.id,
    } satisfies PathParamsObject<typeof scheduleApis.appointments.update>,
    type: OfflineKeyMap.update_appointment_status,
    resourceType: "Appointment",
    payload: updateAppointmentData,
    normalizedData: {
      ...appointment,
      status: status as any, // Type assertion to handle the status type mismatch
      is_updated_offline: true,
    },
    parentMutationId: isOfflineId(appointment.id)
      ? appointment.id
      : existingRescheduleEntry
        ? rescheduleId //  reschedule write exists and if we are updating status
        : undefined,
  };

  const writeEntry: saveOfflineWriteData = !isOfflineId(appointment.id)
    ? {
        ...baseEntry,
        serverTimestamp: appointment.modified_date,
        useQueryRouteKey: "retrieveAppointment",
        useQueryPathParams: {
          facility_id: appointment.facility.id,
          id: appointment.id,
        },
      }
    : baseEntry;

  try {
    if (existingStatusEntry) {
      await db.OfflineWrites.update(statusupdateId, writeEntry);
    } else {
      const saveResult = await saveOfflineWrite(writeEntry);
      if (!saveResult.success) {
        const error = new Error(saveResult.error);
        onError?.(error);
        return;
      }
    }

    const normalizedAppointment = await normalizeAndSetQueryDataForUpdate({
      entry: writeEntry,
      appointment,
      queryClient,
      authUser,
      status,
      facilityId,
      db,
    });

    // Call success callback
    onSuccess?.(appointment.id, normalizedAppointment);
  } catch (error) {
    const errorObj =
      error instanceof Error ? error : new Error("Unknown error occurred");
    onError?.(errorObj);
  }
};

export const queueCancelAppointmentRecord = async ({
  cancelAppointmentData,
  appointment,
  authUser,
  status,
  facilityId,
  queryClient,
  t: _t,
  db,
  onSuccess,
  onError,
}: QueueCancelAppointmentRecordParams): Promise<void> => {
  const cancelAppointmentID = isOfflineId(appointment.id)
    ? `${appointment.id}-cancel`
    : `offline-${appointment.id}-cancel`;

  const offlineEntry: saveOfflineWriteData = {
    id: cancelAppointmentID,
    userId: authUser?.id,
    facilityId: facilityId,
    mutationSyncRouteKey: OfflineKeyMap.cancel_appointment,
    mutationPathParams: {
      facilityId,
      id: appointment.id,
    } satisfies PathParamsObject<typeof scheduleApis.appointments.cancel>,
    type: OfflineKeyMap.cancel_appointment,
    resourceType: "Appointment",
    payload: cancelAppointmentData,
    normalizedData: {
      ...appointment,
      status: status as any, // Type assertion to handle the status type mismatch
      is_updated_offline: true,
    },
  };

  const prevTokenSlot = appointment.token_slot; //prev slot
  const prevDate = new Date(appointment.token_slot.start_datetime); // previous date
  const prevMonth = getMonthFromDate(appointment.token_slot.start_datetime); // previous month

  try {
    if (isOfflineId(appointment.id)) {
      const existingCreateEntry = await db.OfflineWrites.get(appointment.id);
      if (existingCreateEntry?.type === OfflineKeyMap.create_appointment) {
        await db.OfflineWrites.delete(appointment.id);
        // Call success callback for unsynced appointment cancellation
        onSuccess?.(appointment.id, {
          ...appointment,
          status: status as any, // Type assertion to handle the status type mismatch
          is_updated_offline: true,
        });
        return;
      }
    } else {
      const saveResult = await saveOfflineWrite(offlineEntry);
      if (!saveResult.success) {
        const error = new Error(saveResult.error);
        onError?.(error);
        return;
      }
    }

    const statusUpdateID = isOfflineId(appointment.id)
      ? `${appointment.id}-statusUpdate`
      : `offline-${appointment.id}-statusUpdate`;

    const rescheduleID = isOfflineId(appointment.id)
      ? `${appointment.id}+reschedule`
      : `offline-${appointment.id}-reschedule`;

    await Promise.allSettled([
      db.OfflineWrites.delete(statusUpdateID),
      db.OfflineWrites.delete(rescheduleID),
    ]);

    const normalizedAppointment = await normalizeAndSetQueryDataForCancel({
      entry: offlineEntry,
      appointment,
      queryClient,
      authUser,
      status,
      facilityId,
      db,
      prevTokenSlot,
      prevDate,
      prevMonth,
    });

    // Call success callback
    onSuccess?.(appointment.id, normalizedAppointment);
  } catch (error) {
    const errorObj =
      error instanceof Error ? error : new Error("Unknown error occurred");
    onError?.(errorObj);
  }
};

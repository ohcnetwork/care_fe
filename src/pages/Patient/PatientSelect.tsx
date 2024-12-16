import careConfig from "@careConfig";
import { useMutation, useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

import { PatientModel } from "@/components/Patient/models";
import { ScheduleAPIs } from "@/components/Schedule/api";
import {
  AppointmentCreate,
  SlotAvailability,
} from "@/components/Schedule/types";

import * as Notification from "@/Utils/Notifications";
import request from "@/Utils/request/request";
import { PaginatedResponse, RequestResult } from "@/Utils/request/types";
import { formatDate } from "@/Utils/utils";

export default function PatientSelect({
  facilityId,
  staffUsername,
}: {
  facilityId: string;
  staffUsername: string;
}) {
  const phoneNumber = localStorage.getItem("phoneNumber");
  const selectedSlot = JSON.parse(
    localStorage.getItem("selectedSlot") ?? "",
  ) as SlotAvailability;
  const reason = localStorage.getItem("reason");
  const OTPaccessToken = localStorage.getItem("OTPaccessToken");
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);

  if (!staffUsername) {
    Notification.Error({ msg: "Staff Username Not Found" });
    navigate(`/facility/${facilityId}/`);
  } else if (!phoneNumber) {
    Notification.Error({ msg: "Phone Number Not Found" });
    navigate(`/facility/${facilityId}/appointments/${staffUsername}/otp/send`);
  } else if (!selectedSlot) {
    Notification.Error({ msg: "Selected Slot Not Found" });
    navigate(
      `/facility/${facilityId}/appointments/${staffUsername}/book-appointment`,
    );
  }

  const { data: patientData } = useQuery<
    RequestResult<PaginatedResponse<PatientModel>>
  >({
    queryKey: ["patient", phoneNumber],
    queryFn: async () => {
      const res = await fetch(
        `${careConfig.apiUrl}/api/v1/otp/patient/?phone_number=${phoneNumber ?? ""}`,
        {
          headers: {
            Authorization: `Bearer ${OTPaccessToken}`,
            "Content-Type": "application/json",
          },
        },
      );
      const data = await res.json();
      return { res, data, error: res.ok ? undefined : data };
    },
    enabled: !!phoneNumber && !!OTPaccessToken,
  });

  const { mutate: createAppointment } = useMutation({
    mutationFn: async (body: AppointmentCreate) => {
      const { res, data } = await request(
        ScheduleAPIs.slots.createAppointment,
        {
          pathParams: {
            facility_id: facilityId,
            slot_id: selectedSlot?.id ?? "",
          },
          body,
        },
      );
      if (res?.status === 200) {
        Notification.Success({ msg: "Appointment created successfully" });
        navigate(`/facility/${facilityId}/appointments/${data?.id}/success`);
      }
      //To do: mock appointment creation, remove this
      navigate(`/facility/${facilityId}/appointments/123/success`);
      return res;
    },
  });

  const mockPatientData = [
    {
      id: "T105690908240017",
      name: "Leo Westervelt",
      phone_number: "9876543120",
      date_of_birth: "1996-01-04",
      gender: 1,
      blood_group: "O+",
      nationality: "India",
      is_active: true,
    },
    {
      id: "T105690908240019",
      name: "Tatiana Franci",
      phone_number: "9876543120",
      date_of_birth: "1998-06-02",
      gender: 2,
      blood_group: "B+",
      nationality: "India",
      is_active: true,
    },
    {
      id: "T105690908240032",
      name: "Rayna Passaquindici Arcand",
      phone_number: "9876543120",
      date_of_birth: "1991-05-23",
      gender: 2,
      blood_group: "A+",
      nationality: "India",
      is_active: true,
    },
  ];

  const patients = patientData?.data?.results ?? mockPatientData;

  const renderNoPatientFound = () => {
    return (
      <div className="">
        <span className="text-base font-medium">
          No patients found with this phone number. Please create a new patient
          to proceed with booking appointment.
        </span>
      </div>
    );
  };

  const renderPatientList = () => {
    return (
      <div className="overflow-auto max-h-[400px]">
        <table className="w-full">
          <thead className="text-sm bg-secondary-200 font-medium">
            <tr>
              <th className="w-2/6 p-2 text-left">Patient Name/UHID</th>
              <th className="w-1/6 p-2 text-left">Primary Ph No.</th>
              <th className="w-1/6 p-2 text-left">Date of birth/Age</th>
              <th className="w-1/6 p-2 text-left">Sex</th>
            </tr>
          </thead>
          <tbody className="divide-y rounded-lg border bg-card">
            {patients?.map((patient) => (
              <tr
                key={patient.id}
                onClick={() => setSelectedPatient(patient.id ?? null)}
                className="hover:bg-secondary-100 cursor-pointer"
              >
                {selectedPatient === patient.id ? (
                  <td colSpan={4} className="w-full p-4">
                    <div className="flex items-center justify-center gap-4">
                      <Button
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPatient(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          createAppointment({
                            patient: patient.id ?? "",
                            reason_for_visit: reason ?? "",
                          });
                        }}
                      >
                        Confirm
                      </Button>
                    </div>
                  </td>
                ) : (
                  <>
                    <td className="p-4">
                      <div className="font-medium">{patient.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {patient.id}
                      </div>
                    </td>
                    <td className="p-4">{patient.phone_number}</td>
                    <td className="p-4">
                      {formatDate(
                        new Date(patient.date_of_birth ?? ""),
                        "dd MMM yyyy",
                      )}
                    </td>
                    <td className="p-4">
                      {patient.gender === 1 ? "Male" : "Female"}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex px-2 pb-4 justify-start">
        <Button
          variant="outline"
          className="border border-secondary-400"
          onClick={() =>
            navigate(
              `/facility/${facilityId}/appointments/${staffUsername}/book-appointment`,
            )
          }
        >
          <CareIcon icon="l-square-shape" className="h-4 w-4 mr-1" />
          <span className="text-sm underline">Back</span>
        </Button>
      </div>
      <div className="flex flex-col justify-center space-y-4 bg-white rounded-lg shadow-md p-8">
        <h3 className="text-lg font-medium">Select/Register Patient</h3>
        {(patients?.length ?? 0) > 0
          ? renderPatientList()
          : renderNoPatientFound()}
        <Button
          variant="primary_gradient"
          className="w-1/2 self-center"
          onClick={() =>
            navigate(
              `/facility/${facilityId}/appointments/${staffUsername}/patient-registration`,
            )
          }
        >
          <span className="bg-gradient-to-b from-white/15 to-transparent"></span>
          Add New Patient
        </Button>
      </div>
    </div>
  );
}

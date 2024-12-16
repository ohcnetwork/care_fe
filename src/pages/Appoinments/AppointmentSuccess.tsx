import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { navigate } from "raviger";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

import { ScheduleAPIs } from "@/components/Schedule/api";
import { Appointment } from "@/components/Schedule/types";

import * as Notification from "@/Utils/Notifications";
import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";

interface AppointmentSuccessProps {
  facilityId: string;
  appointmentId: string;
}

export function AppointmentSuccess(props: AppointmentSuccessProps) {
  const { appointmentId, facilityId } = props;

  const { data, error } = useQuery<Appointment>({
    queryKey: ["appointment", appointmentId],
    queryFn: query(ScheduleAPIs.appointments.retrieve, {
      pathParams: { id: appointmentId, facility_id: facilityId },
      silent: true,
    }),
  });

  if (error) {
    Notification.Error({ msg: "Appointment not found" });
    //To do: disabled for mock appointment, remove this
    //navigate(`/facility/${facilityId}/`);
  }

  const mockAppointment: Appointment = {
    id: "123",
    resource: {
      id: "456",
      first_name: "Anjali",
      last_name: "Narayanan",
      username: "anjali.narayanan",
      email: "anjali.narayanan@carecompanion.in",
      user_type: 15,
      last_login: "2024-03-15T09:30:00Z",
    },
    patient: {
      id: "789",
      name: "Janaki Sivaraman",
      gender: 2,
      date_of_birth: "1990-05-15",
      age: 30,
      address: "123 Main Street, City, Country",
      pincode: "123456",
    },
    token_slot: {
      start_datetime: "2023-12-20T12:30:00Z",
      end_datetime: "2023-12-20T13:30:00Z",
      id: "123",
      availability: {
        name: "Anjali Narayanan, B.Sc. Nursing",
        tokens_per_slot: 1,
      },
      allocated: 1,
    },
    reason_for_visit: "General Checkup",
    booked_on: "2024-03-15T09:30:00Z",
    booked_by: {
      id: "123",
      first_name: "Anjali",
      last_name: "Narayanan",
      username: "anjali.narayanan",
      email: "anjali.narayanan@carecompanion.in",
      user_type: 15,
      last_login: "2024-03-15T09:30:00Z",
    },
    status: "booked",
  } as const;

  const appointmentData = data ?? mockAppointment;

  return (
    <div className="max-w-2xl mx-auto p-8 mt-4">
      <div className="flex flex-row justify-start mb-4">
        <Button
          variant="outline"
          className="border border-secondary-400"
          onClick={() => {
            navigate("/facilities");
          }}
        >
          <CareIcon icon="l-square-shape" className="h-4 w-4 mr-1" />
          <span className="text-sm underline">Back to Home</span>
        </Button>
      </div>
      <div className="bg-secondary-100/50 rounded-lg shadow-sm p-12 border border-secondary-400 text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
          <CareIcon icon="l-check" className="w-8 h-8 text-green-600" />
        </div>

        <h1 className="text-2xl font-medium text-gray-900 mb-2">
          Your appointment has been successfully booked!
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h2 className="text-sm font-medium text-gray-500 mb-1">
            Doctor/Nurse:
          </h2>
          <p className="text-lg font-medium">
            {formatName(appointmentData?.resource)}
          </p>
        </div>

        <div>
          <h2 className="text-sm font-medium text-gray-500 mb-1">Patient:</h2>
          <p className="text-lg font-medium">{appointmentData?.patient.name}</p>
        </div>

        <div>
          <h2 className="text-sm font-medium text-gray-500 mb-1">Date:</h2>
          <p className="text-lg font-medium">
            {format(
              new Date(appointmentData?.token_slot.start_datetime ?? ""),
              "do MMMM",
            )}
          </p>
        </div>

        <div>
          <h2 className="text-sm font-medium text-gray-500 mb-1">Time:</h2>
          <p className="text-lg font-medium">
            {format(
              new Date(appointmentData?.token_slot.start_datetime ?? ""),
              "hh:mm a",
            )}
          </p>
        </div>
      </div>

      <div className="mt-12 text-left space-y-2">
        <p className="text-gray-900">
          {formatName(appointmentData?.resource)} will visit the patient at the
          scheduled time.
        </p>
        <p className="text-gray-600">Thank you for choosing our care service</p>
      </div>
    </div>
  );
}

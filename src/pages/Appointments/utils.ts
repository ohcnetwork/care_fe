import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import {
  compareAsc,
  eachDayOfInterval,
  format,
  max,
  startOfToday,
} from "date-fns";
import { TFunction } from "i18next";
import { toast } from "sonner";

import { FacilityModel } from "@/components/Facility/models";

import query from "@/Utils/request/query";
import {
  dateQueryString,
  formatDisplayName,
  formatPatientAge,
  getMonthStartAndEnd,
} from "@/Utils/utils";
import { getFakeTokenNumber } from "@/pages/Scheduling/utils";
import {
  Appointment,
  AvailabilityHeatmapResponse,
  TokenSlot,
} from "@/types/scheduling/schedule";
import scheduleApis from "@/types/scheduling/scheduleApis";

export const groupSlotsByAvailability = (slots: TokenSlot[]) => {
  const result: {
    availability: TokenSlot["availability"];
    slots: Omit<TokenSlot, "availability">[];
  }[] = [];

  for (const slot of slots) {
    const availability = slot.availability;
    const existing = result.find(
      (r) => r.availability.name === availability.name,
    );
    if (existing) {
      existing.slots.push(slot);
    } else {
      result.push({ availability, slots: [slot] });
    }
  }

  // sort slots by start time
  result.forEach(({ slots }) =>
    slots.sort((a, b) => compareAsc(a.start_datetime, b.start_datetime)),
  );

  // sort availability by first slot start time
  result.sort((a, b) =>
    compareAsc(a.slots[0].start_datetime, b.slots[0].start_datetime),
  );

  return result;
};

/**
 * Get the availability heatmap for a user for a given month
 */
export const useAvailabilityHeatmap = ({
  facilityId,
  userId,
  month,
}: {
  facilityId: string;
  userId?: string;
  month: Date;
}) => {
  const { start, end } = getMonthStartAndEnd(month);

  // start from today if the month is current or past
  const fromDate = dateQueryString(max([start, startOfToday()]));
  const toDate = dateQueryString(end);

  let queryFn = query(scheduleApis.slots.availabilityStats, {
    pathParams: { facility_id: facilityId },
    body: {
      // voluntarily coalesce to empty string since we know query would be
      // enabled only if userId is present
      user: userId ?? "",
      from_date: fromDate,
      to_date: toDate,
    },
  });

  if (careConfig.appointments.useAvailabilityStatsAPI === false) {
    queryFn = async () => getInfiniteAvailabilityHeatmap({ fromDate, toDate });
  }

  return useQuery({
    queryKey: ["availabilityHeatmap", userId, fromDate, toDate],
    queryFn,
    enabled: !!userId,
  });
};

const getInfiniteAvailabilityHeatmap = ({
  fromDate,
  toDate,
}: {
  fromDate: string;
  toDate: string;
}) => {
  const dates = eachDayOfInterval({ start: fromDate, end: toDate });

  const result: AvailabilityHeatmapResponse = {};

  for (const date of dates) {
    result[dateQueryString(date)] = { total_slots: Infinity, booked_slots: 0 };
  }

  return result;
};

export const formatAppointmentSlotTime = (appointment: Appointment) => {
  if (!appointment.token_slot?.start_datetime) {
    return "";
  }
  return format(appointment.token_slot.start_datetime, "dd MMM, yyyy, hh:mm a");
};

export const formatSlotTimeRange = (slot: {
  start_datetime: string;
  end_datetime: string;
}) => {
  return `${format(slot.start_datetime, "h:mm a")} - ${format(
    slot.end_datetime,
    "h:mm a",
  )}`;
};

/**
 * TODO: optimzie this later using section-to-print
 */
export const printAppointment = ({
  t,
  facility,
  appointment,
}: {
  t: TFunction;
  facility: FacilityModel;
  appointment: Appointment;
}) => {
  const patient = appointment.patient;
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    toast.error(t("failed_to_open_print_window"));
    return;
  }

  // Add content and necessary styles to the new window
  printWindow.document.write(`
    <html>
      <head>
        <title>${t("appointment_token")}</title>
        <!-- Include Tailwind CSS from CDN -->
        <link
          href="https://cdn.jsdelivr.net/npm/tailwindcss@3.2.7/dist/tailwind.min.css"
          rel="stylesheet"
        />
        <style>
          body { margin: 0; padding: 16px; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
          <div
id="appointment-token-card"
style="
  background-color: #F9FAFB; /* bg-gray-50 */
  padding: 1rem;            /* p-4 */
"
>
<div
  style="
    border-radius: 0.75rem;                /* rounded-xl */
    background-color: #FFFFFF;             /* bg-white */
    color: #0B0B0B;                        /* text-gray-950 (approx) */
    box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05); /* shadow */
    padding: 1.5rem;                       /* p-6 */
    width: 30rem;                          /* w-[30rem] */
    border: 1px solid #D1D5DB;             /* border border-gray-300 */
    position: relative;                    /* relative */
    transition: all 0.3s ease-in-out;      /* transition-all duration-300 ease-in-out (hover won't apply inline) */
  "
>
  <!-- Watermark-like background -->
  <div
    style="
      position: absolute;      /* absolute */
      top: 0; right: 0;
      bottom: 0; left: 0;     /* inset-0 */
      opacity: 0.1;           /* opacity-[0.1] */
      pointer-events: none;    /* pointer-events-none */
      background-image: url('/images/care_logo_gray.svg'); /* bg-[url('/images/care_logo_gray.svg')] */
      background-position: center;          /* bg-center */
      background-repeat: no-repeat;         /* bg-no-repeat */
      background-size: 60% auto;            /* bg-[length:60%_auto] */
    "
  ></div>

  <div style="position: relative;">
    <!-- Top row: hospital name & badge -->
    <div
      style="
        display: flex;              /* flex */
        align-items: flex-start;    /* items-start */
        justify-content: space-between; /* justify-between */
      "
    >
      <div>
        <h3
          style="
            font-size: 1.125rem;    /* text-lg */
            line-height: 1.75rem;
            font-weight: 700;       /* font-bold */
            letter-spacing: -0.025em; /* tracking-tight (approx) */
          "
        >
          ${facility.name}
        </h3>
        <div
          style="
            font-size: 0.875rem;         /* text-sm */
            line-height: 1.25rem;
            color: #4B5563;             /* text-gray-600 */
          "
        >
          <span>${facility.name}</span>
          <span>Ph.: ${facility.pincode}</span>
        </div>
      </div>

      <div
        style="
          font-size: 0.875rem;             /* text-sm */
          line-height: 1.25rem;
          white-space: nowrap;             /* whitespace-nowrap */
          text-align: center;              /* text-center */
          background-color: #F3F4F6;       /* bg-gray-100 */
          padding-left: 0.75rem;           /* px-3 */
          padding-right: 0.75rem;
          padding-bottom: 0.5rem;          /* pb-2 */
          padding-top: 1.5rem;             /* pt-6 */
          margin-top: -1.5rem;            /* -mt-6 */
          font-weight: 500;               /* font-medium */
          color: #6B7280;                 /* text-gray-500 */
        "
      >
        <p>GENERAL</p>
        <p>OP TOKEN</p>
      </div>
    </div>

    <!-- Patient info row -->
    <div
      style="
        margin-top: 1rem;               /* mt-4 */
        display: flex;                  /* flex */
        align-items: flex-start;        /* items-start */
        justify-content: space-between; /* justify-between */
      "
    >
      <div>
        <label
          style="
            font-size: 0.875rem; /* text-sm */
            line-height: 1;      /* leading-none */
            font-weight: 500;    /* font-medium */
          "
        >
          Name
        </label>
        <p style="font-weight: 600; /* font-semibold */">${patient.name}</p>
        <p
          style="
            font-size: 0.875rem;     /* text-sm */
            color: #4B5563;         /* text-gray-600 */
            font-weight: 500;       /* font-medium */
          "
        >
          ${formatPatientAge(patient as any, true)}, ${t(`GENDER__${patient.gender}`)}
        </p>
      </div>
      <div
        style="
          display: flex;       /* flex */
          align-items: center; /* items-center */
          gap: 0.5rem;         /* gap-2 (approx) */
        "
      >
        <div>
          <label
            style="
              font-size: 0.875rem; /* text-sm */
              font-weight: 700;    /* text-black font-semibold (approx) */
            "
          >
            Token No.
          </label>
          <p
            style="
              font-size: 3rem;     /* text-5xl */
              font-weight: 700;    /* font-bold */
              line-height: 1;      /* leading-none */
              margin: 0;
            "
          >
            ${getFakeTokenNumber(appointment)}
          </p>
        </div>
      </div>
    </div>

    <!-- Bottom row: Practitioner & date/time + QR -->
    <div
      style="
        margin-top: 1rem;               /* mt-4 */
        display: flex;                  /* flex */
        justify-content: space-between; /* justify-between */
      "
    >
      <div
        style="
          display: flex;
          flex-direction: column;
          row-gap: 0.5rem;  /* space-y-2 approximation */
        "
      >
        <div>
          <label
            style="
              font-size: 0.875rem; /* text-sm */
              font-weight: 500;    /* font-medium */
            "
          >
            Practitioner:
          </label>
          <p
            style="
              font-size: 0.875rem; /* text-sm */
              font-weight: 600;    /* font-semibold */
              margin: 0.25rem 0 0 0;
            "
          >
            ${formatDisplayName(appointment.user)}
          </p>
        </div>
        <div>
          <p
            style="
              font-size: 0.875rem; /* text-sm */
              font-weight: 600;    /* font-semibold */
              color: #4B5563;      /* text-gray-600 */
              margin: 0.25rem 0 0 0;
            "
          >
            ${format(appointment.token_slot.start_datetime, "MMMM d, yyyy")}, ${format(appointment.token_slot.start_datetime, "h:mm a")} - ${format(appointment.token_slot.end_datetime, "h:mm a")}
          </p>
        </div>
      </div>
      <div>
        <!-- Example QR (as <svg>) -->
        <svg
          height="64"
          width="64"
          viewBox="0 0 29 29"
          role="img"
        >
          <path
            fill="#FFFFFF"
            d="M0,0 h29v29H0z"
            shape-rendering="crispEdges"
          ></path>
          <path
            fill="#000000"
            d="M0 0h7v1H0zM9 0h1v1H9zM12 0h2v1H12zM15 0h1v1H15zM19 0h1v1H19zM22,0 h7v1H22zM0 1h1v1H0zM6 1h1v1H6zM12 1h6v1H12zM20 1h1v1H20zM22 1h1v1H22zM28,1 h1v1H28zM0 2h1v1H0zM2 2h3v1H2zM6 2h1v1H6zM8 2h4v1H8zM13 2h1v1H13zM18 2h1v1H18zM22 2h1v1H22zM24 2h3v1H24zM28,2 h1v1H28zM0 3h1v1H0zM2 3h3v1H2zM6 3h1v1H6zM8 3h1v1H8zM11 3h1v1H11zM14 3h2v1H14zM17 3h4v1H17zM22 3h1v1H22zM24 3h3v1H24zM28,3 h1v1H28zM0 4h1v1H0zM2 4h3v1H2zM6 4h1v1H6zM8 4h1v1H8zM10 4h1v1H10zM16 4h4v1H16zM22 4h1v1H22zM24 4h3v1H24zM28,4 h1v1H28zM0 5h1v1H0zM6 5h1v1H6zM8 5h5v1H8zM15 5h1v1H15zM22 5h1v1H22zM28,5 h1v1H28zM0 6h7v1H0zM8 6h1v1H8zM10 6h1v1H10zM12 6h1v1H12zM14 6h1v1H14zM16 6h1v1H16zM18 6h1v1H18zM20 6h1v1H20zM22,6 h7v1H22zM8 7h1v1H8zM10 7h2v1H10zM14 7h2v1H14zM20 7h1v1H20zM0 8h1v1H0zM2 8h5v1H2zM11 8h2v1H11zM15 8h3v1H15zM22 8h5v1H22zM3 9h1v1H3zM7 9h2v1H7zM10 9h1v1H10zM13 9h2v1H13zM18 9h3v1H18zM22 9h1v1H22zM24 9h2v1H24zM28,9 h1v1H28zM6 10h2v1H6zM10 10h1v1H10zM13 10h4v1H13zM20 10h3v1H20zM24 10h4v1H24zM0 11h3v1H0zM4 11h1v1H4zM8 11h1v1H8zM10 11h1v1H10zM12 11h2v1H12zM18 11h1v1H18zM23 11h3v1H23zM27,11 h2v1H27zM1 12h3v1H1zM6 12h1v1H6zM8 12h1v1H8zM10 12h1v1H10zM14 12h2v1H14zM17 12h5v1H17zM23 12h1v1H23zM26 12h1v1H26zM0 13h2v1H0zM3 13h3v1H3zM7 13h1v1H7zM9 13h1v1H9zM11 13h1v1H11zM16 13h1v1H16zM19 13h1v1H19zM21 13h2v1H21zM24 13h2v1H24zM27,13 h2v1H27zM0 14h1v1H0zM3 14h1v1H3zM6 14h1v1H6zM8 14h1v1H8zM10 14h2v1H10zM15 14h1v1H15zM20 14h1v1H20zM22 14h3v1H22zM2 15h1v1H2zM8 15h2v1H8zM14 15h1v1H14zM16 15h1v1H16zM20 15h1v1H20zM23 15h2v1H23zM4 16h4v1H4zM11 16h2v1H11zM15 16h1v1H15zM17 16h3v1H17zM21 16h1v1H21zM23 16h1v1H23zM25,16 h4v1H25zM0 17h2v1H0zM3 17h1v1H3zM7 17h1v1H7zM9 17h1v1H9zM11 17h1v1H11zM13 17h2v1H13zM16 17h2v1H16zM19 17h1v1H19zM22 17h1v1H22zM24 17h2v1H24zM28,17 h1v1H28zM0 18h1v1H0zM2 18h2v1H2zM5 18h3v1H5zM9 18h1v1H9zM12 18h5v1H12zM18 18h1v1H18zM20 18h1v1H20zM23 18h3v1H23zM27 18h1v1H27zM0 19h1v1H0zM3 19h1v1H3zM5 19h1v1H5zM8 19h4v1H8zM13 19h1v1H13zM18 19h1v1H18zM21 19h1v1H21zM23 19h3v1H23zM27,19 h2v1H27zM0 20h1v1H0zM2 20h2v1H2zM6 20h1v1H6zM8 20h2v1H8zM14 20h2v1H14zM17 20h2v1H17zM20 20h5v1H20zM26 20h2v1H26zM8 21h1v1H8zM10 21h3v1H10zM16 21h1v1H16zM19 21h2v1H19zM24 21h1v1H24zM27,21 h2v1H27zM0 22h7v1H0zM11 22h1v1H11zM15 22h3v1H15zM19 22h2v1H19zM22 22h1v1H22zM24 22h1v1H24zM26 22h1v1H26zM0 23h1v1H0zM6 23h1v1H6zM8 23h1v1H8zM10 23h1v1H10zM14 23h3v1H14zM20 23h1v1H20zM24 23h1v1H24zM27 23h1v1H27zM0 24h1v1H0zM2 24h3v1H2zM6 24h1v1H6zM8 24h1v1H8zM11 24h2v1H11zM15 24h3v1H15zM20 24h7v1H20zM0 25h1v1H0zM2 25h3v1H2zM6 25h1v1H6zM8 25h1v1H8zM10 25h1v1H10zM12 25h1v1H12zM14 25h1v1H14zM18 25h1v1H18zM21 25h1v1H21zM23 25h1v1H23zM25 25h1v1H25zM27,25 h2v1H27zM0 26h1v1H0zM2 26h3v1H2zM6 26h1v1H6zM8 26h2v1H8zM11 26h2v1H11zM14 26h3v1H14zM19 26h1v1H19zM22 26h1v1H22zM24 26h4v1H24zM0 27h1v1H0zM6 27h1v1H6zM10 27h2v1H10zM19 27h2v1H19zM23 27h2v1H23zM27 27h1v1H27zM0 28h7v1H0zM8 28h1v1H8zM11 28h1v1H11zM15 28h4v1H15zM21 28h1v1H21zM23 28h1v1H23zM26 28h1v1H26z"
            shape-rendering="crispEdges"
          ></path>
        </svg>
      </div>
    </div>
  </div>
</div>
</div>

      </body>
    </html>
  `);

  printWindow.document.close();

  // Wait for content to load before printing
  printWindow.onload = () => {
    printWindow.print();
    printWindow.onafterprint = () => printWindow.close();
  };
};

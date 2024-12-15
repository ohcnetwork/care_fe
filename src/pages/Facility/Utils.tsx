import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";

import { UserBareMinimum } from "@/components/Users/models";

const getSpecializationText = (specializations: string[]) => {
  if (specializations.length === 1) {
    return specializations[0];
  }
  return (
    specializations.slice(0, -1).join(", ") +
    " and " +
    specializations[specializations.length - 1]
  );
};
const getExperienceText = (experience: string) => {
  const years =
    (Date.now() - new Date(experience).getTime()) /
    (365.25 * 24 * 60 * 60 * 1000);
  const wholeYears = Math.floor(years);
  const hasHalfYear = years - wholeYears >= 0.5;
  const displayYears = hasHalfYear ? `${wholeYears}+` : `${wholeYears}`;

  return `${displayYears} ${wholeYears === 1 ? "year" : "years"}`;
};

export const getExperience = (doctor: DoctorModel) => {
  return (
    getExperienceText(doctor.experience) +
    " in " +
    getSpecializationText(doctor.specializations)
  );
};

export interface DoctorModel extends UserBareMinimum {
  role: string;
  education: string;
  experience: string;
  languages: string[];
  specializations: string[];
}

export const mockDoctors: DoctorModel[] = [
  {
    id: 1,
    first_name: "Anjali",
    last_name: "Narayanan",
    username: "anjali.narayanan",
    email: "anjali.narayanan@carecompanion.in",
    user_type: "Doctor",
    last_login: "2024-03-15T09:30:00Z",
    read_profile_picture_url: "/images/doctors/anjali.png",
    role: "Senior Palliative Care Specialist",
    education: "MBBS, MD (Palliative Medicine)",
    languages: ["Malayalam", "Tamil", "English"],
    experience: "2011-08-23T00:00:00Z",
    specializations: ["Palliative Care", "Pain Management", "End-of-Life Care"],
  },
  {
    id: 2,
    first_name: "Rajesh",
    last_name: "K V",
    username: "rajesh.kv",
    email: "rajesh.kv@carecompanion.in",
    user_type: "Doctor",
    last_login: "2024-03-14T16:45:00Z",
    read_profile_picture_url: "/images/doctors/rajesh.png",
    role: "General Physician",
    education: "MBBS, DNB (Family Medicine)",
    languages: ["English", "Hindi", "Tamil", "Malayalam"],
    experience: "2015-11-15T00:00:00Z",
    specializations: ["Primary Healthcare", "Family Medicine"],
  },
  {
    id: 3,
    first_name: "Meena",
    last_name: "Rajan",
    username: "meena.rajan",
    email: "meena.rajan@carecompanion.in",
    user_type: "Doctor",
    last_login: "never",
    read_profile_picture_url: "/images/doctors/meena.png",
    role: "Medical Oncologist",
    education: "MBBS, MD (Internal Medicine), DM (Medical Oncology)",
    languages: ["English", "Tamil", "Telugu"],
    experience: "2013-03-07T00:00:00Z",
    specializations: ["Medical Oncology", "Palliative Medicine"],
  },
  {
    id: 4,
    first_name: "Anu",
    last_name: "Mathew",
    username: "anu.mathew",
    email: "anu.mathew@carecompanion.in",
    user_type: "Doctor",
    last_login: "2024-03-15T11:15:00Z",
    read_profile_picture_url: "/images/doctors/anu.png",
    role: "Pain Management Specialist",
    education: "MBBS, MD (Anesthesiology), Fellowship in Pain Medicine",
    languages: ["English", "Hindi", "Tamil", "Malayalam"],
    experience: "2008-09-12T00:00:00Z",
    specializations: [
      "Chronic Pain Management",
      "Interventional Pain Medicine",
    ],
  },
];

export const FACILITY_FEATURES = {
  1: { label: "Water Bed", variant: "green" },
  2: { label: "24/7 Care", variant: "blue" },
  3: { label: "Wheelchair", variant: "amber" },
  4: { label: "Mobility Aids", variant: "orange" },
  5: { label: "Pain Management Tools", variant: "teal" },
  6: { label: "Incontinence Support", variant: "teal" },
  7: { label: "Adjustable Hospital Beds", variant: "teal" },
} as const;

export type FeatureId = keyof typeof FACILITY_FEATURES;

export const FeatureBadge = ({ featureId }: { featureId: FeatureId }) => {
  const feature = FACILITY_FEATURES[featureId];
  const variantStyles = {
    green: "bg-green-100 text-green-800 hover:bg-green-100",
    blue: "bg-blue-100 text-blue-800 hover:bg-blue-100",
    amber: "bg-amber-100 text-amber-800 hover:bg-amber-100",
    orange: "bg-orange-100 text-orange-800 hover:bg-orange-100",
    teal: "bg-teal-100 text-teal-800 hover:bg-teal-100",
  };

  return (
    <Badge
      variant="outline"
      className={cn("rounded-sm font-normal", variantStyles[feature.variant])}
    >
      {feature.label}
    </Badge>
  );
};

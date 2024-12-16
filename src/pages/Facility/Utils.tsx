import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";

import { SkillObjectModel, UserAssignedModel } from "@/components/Users/models";

import { FACILITY_FEATURE_TYPES } from "@/common/constants";

const getSpecializationText = (specializations: SkillObjectModel[]) => {
  if (specializations.length === 0) {
    return "";
  }
  if (specializations.length === 1) {
    return specializations[0].name ?? "";
  }
  return (
    specializations
      .slice(0, -1)
      .map((s) => s.name)
      .join(", ") +
    " and " +
    specializations[specializations.length - 1].name
  );
};
const getExperienceText = (experience: string) => {
  const experienceDate = new Date(experience);
  experienceDate.setFullYear(experienceDate.getFullYear() - 1);
  const years =
    (Date.now() - experienceDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  const wholeYears = Math.floor(years);
  const hasHalfYear = years - wholeYears >= 0.5;
  const displayYears = hasHalfYear ? `${wholeYears}+` : `${wholeYears}`;

  return `${displayYears} ${wholeYears === 1 ? "year" : "years"}`;
};

export const getExperience = (doctor: DoctorModel) => {
  const specializationText = getSpecializationText(doctor.skills);
  if (!doctor.experience || !specializationText) {
    return "";
  }
  return getExperienceText(doctor.experience) + " in " + specializationText;
};

export interface DoctorModel
  extends Omit<Partial<UserAssignedModel>, "skills"> {
  role: string;
  education: string;
  experience: string;
  languages: string[];
  read_profile_picture_url: string;
  skills: SkillObjectModel[];
}

export const mockDoctors: DoctorModel[] = [
  {
    id: 1,
    user_type: "Doctor",
    first_name: "Anjali",
    last_name: "Narayanan",
    username: "anjali.narayanan",
    email: "anjali.narayanan@carecompanion.in",
    last_login: "2024-03-15T09:30:00Z",
    read_profile_picture_url: "/images/doctors/anjali.png",
    role: "Senior Palliative Care Specialist",
    education: "MBBS, MD (Palliative Medicine)",
    languages: ["Malayalam", "Tamil", "English"],
    experience: "2011-08-23T00:00:00Z",
    skills: [
      { id: "1", name: "Palliative Care" },
      { id: "2", name: "Pain Management" },
      { id: "3", name: "End-of-Life Care" },
    ],
  },
  {
    id: 2,
    user_type: "Doctor",
    first_name: "Rajesh",
    last_name: "K V",
    username: "rajesh.kv",
    email: "rajesh.kv@carecompanion.in",
    last_login: "2024-03-14T16:45:00Z",
    read_profile_picture_url: "/images/doctors/rajesh.png",
    role: "General Physician",
    education: "MBBS, DNB (Family Medicine)",
    languages: ["English", "Hindi", "Tamil", "Malayalam"],
    experience: "2015-11-15T00:00:00Z",
    skills: [
      { id: "1", name: "Primary Healthcare" },
      { id: "2", name: "Family Medicine" },
    ],
  },
  {
    id: 3,
    user_type: "Doctor",
    first_name: "Meena",
    last_name: "Rajan",
    username: "meena.rajan",
    email: "meena.rajan@carecompanion.in",
    last_login: "never",
    read_profile_picture_url: "/images/doctors/meena.png",
    role: "Medical Oncologist",
    education: "MBBS, MD (Internal Medicine), DM (Medical Oncology)",
    languages: ["English", "Tamil", "Telugu"],
    experience: "2013-03-07T00:00:00Z",
    skills: [
      { id: "1", name: "Medical Oncology" },
      { id: "2", name: "Palliative Medicine" },
    ],
  },
  {
    id: 4,
    user_type: "Doctor",
    first_name: "Anu",
    last_name: "Mathew",
    username: "anu.mathew",
    email: "anu.mathew@carecompanion.in",
    last_login: "2024-03-15T11:15:00Z",
    read_profile_picture_url: "/images/doctors/anu.png",
    role: "Pain Management Specialist",
    education: "MBBS, MD (Anesthesiology), Fellowship in Pain Medicine",
    languages: ["English", "Hindi", "Tamil", "Malayalam"],
    experience: "2008-09-12T00:00:00Z",
    skills: [
      { id: "1", name: "Chronic Pain Management" },
      { id: "2", name: "Interventional Pain Medicine" },
    ],
  },
];

export const FeatureBadge = ({ featureId }: { featureId: number }) => {
  const feature = FACILITY_FEATURE_TYPES.find((f) => f.id === featureId);
  if (!feature) {
    return <></>;
  }
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
      className={cn(
        "rounded-sm font-normal",
        variantStyles[feature.variant as keyof typeof variantStyles],
      )}
    >
      <div className="flex flex-row items-center gap-1">
        <CareIcon icon={feature.icon} />
        {feature.name}
      </div>
    </Badge>
  );
};

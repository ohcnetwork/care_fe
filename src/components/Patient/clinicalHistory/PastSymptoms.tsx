/* eslint-disable @typescript-eslint/no-unused-vars */
import { format, parseISO } from "date-fns";
import { Filter, Info, Search } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

// Types based on your schema
interface Code {
  code: string;
  display: string;
  system: string;
}

enum SymptomClinicalStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  RESOLVED = "resolved",
}

enum SymptomVerificationStatus {
  CONFIRMED = "confirmed",
  UNCONFIRMED = "unconfirmed",
}

enum SymptomSeverity {
  MILD = "mild",
  MODERATE = "moderate",
  SEVERE = "severe",
}

interface Onset {
  date?: string;
  string?: string;
}

interface UserBase {
  id: string;
  name: string;
}

interface Symptom {
  id: string;
  code: Code;
  clinical_status: SymptomClinicalStatus;
  verification_status: SymptomVerificationStatus;
  severity: SymptomSeverity;
  onset?: Onset;
  recorded_date?: string;
  note?: string;
  created_by: UserBase;
  updated_by: UserBase;
  category: string;
  encounter: string;
  created_date?: string;
  updated_date?: string;
}

// Mock data for demonstration
const mockSymptoms: Symptom[] = [
  {
    id: "1",
    code: { code: "386661006", display: "Fever", system: "SNOMED-CT" },
    clinical_status: SymptomClinicalStatus.ACTIVE,
    verification_status: SymptomVerificationStatus.CONFIRMED,
    severity: SymptomSeverity.MODERATE,
    recorded_date: "2025-04-19T10:30:00Z",
    created_date: "2025-04-19T10:30:00Z",
    note: "Patient reported fever of 101°F",
    created_by: { id: "user1", name: "Dr. Smith" },
    updated_by: { id: "user1", name: "Dr. Smith" },
    category: "General",
    encounter: "enc123",
  },
  {
    id: "2",
    code: { code: "49727002", display: "Cough", system: "SNOMED-CT" },
    clinical_status: SymptomClinicalStatus.ACTIVE,
    verification_status: SymptomVerificationStatus.CONFIRMED,
    severity: SymptomSeverity.MILD,
    recorded_date: "2025-04-19T10:35:00Z",
    created_date: "2025-04-19T10:35:00Z",
    note: "Dry cough, worse at night",
    created_by: { id: "user1", name: "Dr. Smith" },
    updated_by: { id: "user1", name: "Dr. Smith" },
    category: "Respiratory",
    encounter: "enc123",
  },
  {
    id: "3",
    code: {
      code: "267036007",
      display: "Shortness of breath",
      system: "SNOMED-CT",
    },
    clinical_status: SymptomClinicalStatus.ACTIVE,
    verification_status: SymptomVerificationStatus.CONFIRMED,
    severity: SymptomSeverity.MODERATE,
    recorded_date: "2025-04-19T10:40:00Z",
    created_date: "2025-04-19T10:40:00Z",
    note: "Occurs with minimal exertion",
    created_by: { id: "user1", name: "Dr. Smith" },
    updated_by: { id: "user1", name: "Dr. Smith" },
    category: "Respiratory",
    encounter: "enc123",
  },
  {
    id: "4",
    code: { code: "25064002", display: "Headache", system: "SNOMED-CT" },
    clinical_status: SymptomClinicalStatus.ACTIVE,
    verification_status: SymptomVerificationStatus.CONFIRMED,
    severity: SymptomSeverity.SEVERE,
    recorded_date: "2025-04-15T14:20:00Z",
    created_date: "2025-04-15T14:20:00Z",
    note: "Frontal headache with photophobia",
    created_by: { id: "user2", name: "Dr. Johnson" },
    updated_by: { id: "user2", name: "Dr. Johnson" },
    category: "Neurological",
    encounter: "enc124",
  },
  {
    id: "5",
    code: { code: "422587007", display: "Nausea", system: "SNOMED-CT" },
    clinical_status: SymptomClinicalStatus.RESOLVED,
    verification_status: SymptomVerificationStatus.CONFIRMED,
    severity: SymptomSeverity.MILD,
    recorded_date: "2025-04-10T09:15:00Z",
    created_date: "2025-04-10T09:15:00Z",
    note: "Mild nausea in the morning",
    created_by: { id: "user3", name: "Dr. Williams" },
    updated_by: { id: "user3", name: "Dr. Williams" },
    category: "Gastrointestinal",
    encounter: "enc125",
  },
  // Adding symptoms from 2024 for demonstration
  {
    id: "6",
    code: { code: "267036007", display: "Fatigue", system: "SNOMED-CT" },
    clinical_status: SymptomClinicalStatus.ACTIVE,
    verification_status: SymptomVerificationStatus.CONFIRMED,
    severity: SymptomSeverity.MODERATE,
    recorded_date: "2024-12-10T09:15:00Z",
    created_date: "2024-12-10T09:15:00Z",
    note: "General fatigue throughout the day",
    created_by: { id: "user3", name: "Dr. Williams" },
    updated_by: { id: "user3", name: "Dr. Williams" },
    category: "General",
    encounter: "enc126",
  },
];

// Group symptoms by year and then by date
type GroupedByYearAndDate = {
  [year: string]: {
    [date: string]: Symptom[];
  };
};

const SymptomRow = ({ symptom }: { symptom: Symptom }) => {
  return (
    <div className="flex items-center justify-between rounded-md border px-4 py-2 bg-gray-50 text-sm">
      <div className="font-medium text-black">{symptom.code.display}</div>

      <div className="flex gap-2">
        <span className="rounded-md bg-green-100 px-2 py-1 text-green-800">
          {symptom.clinical_status}
        </span>
        <span className="rounded-md bg-green-100 px-2 py-1 text-green-800">
          {symptom.verification_status}
        </span>
      </div>

      <div className="text-black">
        {symptom.onset?.date
          ? format(parseISO(symptom.onset.date), "dd MMM yyyy")
          : symptom.onset?.string
            ? symptom.onset.string
            : "-"}
      </div>

      <button className="text-gray-600 hover:text-black">
        <Info size={16} />
      </button>
    </div>
  );
};

export default function SymptomsTimeline() {
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [filteredSymptoms, setFilteredSymptoms] = useState<Symptom[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Simulate API call to fetch symptoms
    const fetchSymptoms = async () => {
      try {
        // In a real app, you would fetch from your API
        // const response = await fetch('/api/symptoms');
        // const data = await response.json();

        // Using mock data for demonstration
        setTimeout(() => {
          setSymptoms(mockSymptoms);
          setFilteredSymptoms(mockSymptoms);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error fetching symptoms:", error);
        setLoading(false);
      }
    };

    fetchSymptoms();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredSymptoms(symptoms);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = symptoms.filter(
      (symptom) =>
        symptom.code.display.toLowerCase().includes(query) ||
        symptom.category.toLowerCase().includes(query) ||
        symptom.note?.toLowerCase().includes(query) ||
        symptom.created_by.name.toLowerCase().includes(query),
    );
    setFilteredSymptoms(filtered);
  }, [searchQuery, symptoms]);

  const groupSymptomsByYearAndDate = (
    symptoms: Symptom[],
  ): GroupedByYearAndDate => {
    return symptoms.reduce((groups, symptom) => {
      if (!symptom.created_date) return groups;

      const date = parseISO(symptom.created_date);
      const year = format(date, "yyyy");
      const fullDate = format(date, "yyyy-MM-dd");

      if (!groups[year]) {
        groups[year] = {};
      }

      if (!groups[year][fullDate]) {
        groups[year][fullDate] = [];
      }

      groups[year][fullDate].push(symptom);
      return groups;
    }, {} as GroupedByYearAndDate);
  };

  const getStatusColor = (status: SymptomClinicalStatus) => {
    switch (status) {
      case SymptomClinicalStatus.ACTIVE:
        return "text-green-600";
      case SymptomClinicalStatus.INACTIVE:
        return "text-gray-600";
      case SymptomClinicalStatus.RESOLVED:
        return "text-blue-600";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-sky-100 p-2 rounded-md">
            <Skeleton className="h-6 w-6" />
          </div>
          <Skeleton className="h-8 w-40" />
        </div>
        <div className="flex justify-between mb-6">
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-6 w-16 mb-4" />
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-6 w-32" />
              </div>
              <Skeleton className="h-40 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const groupedSymptoms = groupSymptomsByYearAndDate(filteredSymptoms);
  const sortedYears = Object.keys(groupedSymptoms).sort(
    (a, b) => Number.parseInt(b) - Number.parseInt(a),
  );

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-sky-100 p-2 rounded-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-sky-500"
          >
            <path d="M8 2v4"></path>
            <path d="M16 2v4"></path>
            <rect width="18" height="18" x="3" y="4" rx="2"></rect>
            <path d="M3 10h18"></path>
            <path d="M8 14h.01"></path>
            <path d="M12 14h.01"></path>
            <path d="M16 14h.01"></path>
            <path d="M8 18h.01"></path>
            <path d="M12 18h.01"></path>
            <path d="M16 18h.01"></path>
          </svg>
        </div>
        <h1 className="text-2xl font-bold">Past Symptoms</h1>
      </div>

      <div className="flex justify-between mb-6">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="search"
            placeholder="Search by symptom"
            className="pl-10 h-10 border-gray-300"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {/* <Button variant="outline" className="flex items-center gap-2 h-10">
          <Filter className="h-4 w-4" />
          Filter
        </Button> */}
      </div>

      {sortedYears.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500">No symptoms found</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedYears.map((year) => {
            const datesInYear = groupedSymptoms[year];
            const sortedDates = Object.keys(datesInYear).sort(
              (a, b) => new Date(b).getTime() - new Date(a).getTime(),
            );

            return (
              <div key={year} className="space-y-6">
                <h2 className="text-lg font-medium text-gray-900 border-b pb-1">
                  {year}
                </h2>

                {sortedDates.map((date) => (
                  <div key={date} className="relative pl-7">
                    <div className="absolute left-0 top-1">
                      <div className="h-6 w-6 rounded-full bg-sky-200 flex items-center justify-center">
                        <div className="h-3 w-3 rounded-full bg-sky-500"></div>
                      </div>
                    </div>
                    <div className="mb-3">
                      <h3 className="text-md font-medium text-sky-600">
                        {format(new Date(date), "dd MMMM, yyyy")}
                      </h3>
                    </div>
                    <div>
                      {datesInYear[date].map((symptom, index) => (
                        <SymptomRow key={index} symptom={symptom} />
                      ))}
                    </div>

                    <div className="bg-gray-50 rounded-lg overflow-hidden">
                      {datesInYear[date].map((symptom) => (
                        <div
                          key={symptom.id}
                          className="grid grid-cols-[1fr,100px,120px,120px,40px] text-sm bg-white border-t border-gray-100"
                        >
                          <div className="p-3 font-medium">
                            {symptom.code.display}
                          </div>
                          <div
                            className={`p-3 ${getStatusColor(symptom.clinical_status)}`}
                          >
                            {symptom.clinical_status ===
                            SymptomClinicalStatus.ACTIVE
                              ? "Active"
                              : symptom.clinical_status ===
                                  SymptomClinicalStatus.INACTIVE
                                ? "Inactive"
                                : "Resolved"}
                          </div>
                          <div className="p-3 text-green-600">
                            {symptom.verification_status ===
                            SymptomVerificationStatus.CONFIRMED
                              ? "Confirmed"
                              : "Unconfirmed"}
                          </div>
                          <div className="p-3">
                            {symptom.onset?.date
                              ? format(
                                  parseISO(symptom.onset.date),
                                  "dd MMM yyyy",
                                )
                              : "Not specified"}
                          </div>
                          <div className="p-3 flex justify-center">
                            <button className="text-gray-400 hover:text-gray-600">
                              <Info size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

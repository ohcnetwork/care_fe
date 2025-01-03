import {
  BeakerIcon,
  CookingPotIcon,
  HeartPulseIcon,
  LeafIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Avatar } from "@/components/Common/Avatar";

import { AllergyIntolerance } from "@/types/emr/allergyIntolerance/allergyIntolerance";

type AllergyCategory = "food" | "medication" | "environment" | "biologic";

const CATEGORY_ICONS: Record<AllergyCategory, React.ReactNode> = {
  food: <CookingPotIcon className="h-4 w-4" />,
  medication: <BeakerIcon className="h-4 w-4" />,
  environment: <LeafIcon className="h-4 w-4" />,
  biologic: <HeartPulseIcon className="h-4 w-4" />,
};

interface AllergyTableProps {
  allergies: AllergyIntolerance[];
  showHeader?: boolean;
}

export function AllergyTable({
  allergies,
  showHeader = true,
}: AllergyTableProps) {
  return (
    <Table>
      {showHeader && (
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]"></TableHead>
            <TableHead>Substance</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Critical</TableHead>
            <TableHead>Verification</TableHead>
            <TableHead>Last Occurrence</TableHead>
            <TableHead>By</TableHead>
          </TableRow>
        </TableHeader>
      )}
      <TableBody>
        {allergies.map((allergy) => (
          <TableRow>
            <TableCell className="w-[40px]">
              {allergy.category &&
                CATEGORY_ICONS[allergy.category as AllergyCategory]}
            </TableCell>
            <TableCell className="font-medium">
              {allergy.code.display}
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="capitalize">
                {allergy.clinical_status}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant="secondary" className="capitalize">
                {allergy.criticality}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="capitalize">
                {allergy.verification_status}
              </Badge>
            </TableCell>
            <TableCell className="whitespace-nowrap">
              {allergy.last_occurrence
                ? new Date(allergy.last_occurrence).toLocaleDateString()
                : "-"}
            </TableCell>
            <TableCell className="whitespace-nowrap flex items-center gap-2">
              <Avatar
                name={`${allergy.created_by?.first_name} ${allergy.created_by?.last_name}`}
                className="w-4 h-4"
                imageUrl={allergy.created_by?.profile_picture_url}
              />
              <span className="text-sm">
                {allergy.created_by?.first_name} {allergy.created_by?.last_name}
              </span>
            </TableCell>
            {allergy.note && (
              <TableRow>
                <TableCell colSpan={7} className="px-4 py-2 bg-muted/50">
                  <div className="text-xs text-muted-foreground mb-1">
                    Notes
                  </div>
                  <div className="text-sm">{allergy.note}</div>
                </TableCell>
              </TableRow>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

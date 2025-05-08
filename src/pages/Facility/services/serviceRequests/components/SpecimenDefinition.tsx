"use client";

import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import type {
  SpecimenFromDefinitionCreate,
  SpecimenRead,
} from "@/types/emr/specimen/specimen";
import type { SpecimenDefinitionRead } from "@/types/emr/specimenDefinition/specimenDefinition";

import { SpecimenCard } from "./SpecimenCard";
import { SpecimenForm } from "./SpecimenForm";

interface SpecimenDefinitionProps {
  specimenDefinition: SpecimenDefinitionRead;
  onAddSpecimen: (specimen: SpecimenFromDefinitionCreate) => void;
  onRemoveSpecimen: (specimenId: string) => void;
  specimens: SpecimenRead[];
  facilityId: string;
  serviceRequestId: string;
}

export function SpecimenDefinition({
  specimenDefinition,
  onAddSpecimen,
  specimens,
  facilityId,
  serviceRequestId,
}: SpecimenDefinitionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleCreateSpecimen = (specimen: SpecimenFromDefinitionCreate) => {
    onAddSpecimen(specimen);
    setShowForm(false);
  };

  return (
    <Card className="rounded-sm">
      <CardHeader className="px-1 py-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </Button>
            <CardTitle className="text-sm font-medium">
              {specimenDefinition.title}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowForm(true)}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-4 pt-0">
          <div className="space-y-4">
            {specimens.length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  {specimens.map((specimen) => (
                    <SpecimenCard key={specimen.id} specimen={specimen} />
                  ))}
                </div>
              </>
            )}

            {showForm && (
              <>
                {specimens.length > 0 && <Separator />}
                <SpecimenForm
                  specimenDefinition={specimenDefinition}
                  onSubmit={handleCreateSpecimen}
                  onCancel={() => setShowForm(false)}
                  facilityId={facilityId}
                  serviceRequestId={serviceRequestId}
                />
              </>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

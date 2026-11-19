import { useMutation } from "@tanstack/react-query";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import mutate from "@/Utils/request/mutate";
import { MedicationAdministrationRequest } from "@/types/emr/medicationAdministration/medicationAdministration";
import medicationAdministrationApi from "@/types/emr/medicationAdministration/medicationAdministrationApi";
import {
  MedicationRequestRead,
  displayMedicationName,
} from "@/types/emr/medicationRequest/medicationRequest";
import {
  type AdministrableProductType,
  ProductKnowledgeType,
} from "@/types/inventory/productKnowledge/productKnowledge";

import { MedicineAdminForm } from "./MedicineAdminForm";
import {
  GroupedMedication,
  createMedicationAdministrationRequest,
  getLatestActiveRequest,
} from "./utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medications: MedicationRequestRead[];
  lastAdministeredDates?: Record<string, string>;
  patientId: string;
  encounterId: string;
  productType: AdministrableProductType;
  selectedGroup?: GroupedMedication;
}

interface MedicineListItemProps {
  medicine: MedicationRequestRead;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  administrationRequest?: MedicationAdministrationRequest;
  lastAdministeredDate?: string;
  lastAdministeredBy?: string;
  onAdministrationChange: (request: MedicationAdministrationRequest) => void;
  isValid: (valid: boolean) => void;
  productType: AdministrableProductType;
}

const MedicineListItem = ({
  medicine,
  isSelected,
  onSelect,
  administrationRequest,
  lastAdministeredDate,
  lastAdministeredBy,
  onAdministrationChange,
  isValid,
  productType,
}: MedicineListItemProps) => {
  const { t } = useTranslation();

  return (
    <div className="border-b border-gray-200 py-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {displayMedicationName(medicine)}
            </span>
            {medicine.dosage_instruction.some((di) => di.as_needed_boolean) && (
              <span className="text-sm text-rose-500">
                {t("as_needed_prn")}
              </span>
            )}
          </div>
          {medicine.note && (
            <p className="text-sm text-gray-500 italic whitespace-pre-wrap break-words">
              {medicine.note}
            </p>
          )}
        </div>
        <div className="mt-1 mr-6">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            aria-label={t("select_for_administration")}
          />
        </div>
      </div>

      <div
        className={`grid gap-4 overflow-hidden transition-all ${
          isSelected ? "grid-rows-[1fr] mt-4" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0">
          {isSelected && administrationRequest && (
            <MedicineAdminForm
              medication={medicine}
              lastAdministeredDate={lastAdministeredDate}
              lastAdministeredBy={lastAdministeredBy}
              formId={medicine.id}
              administrationRequest={administrationRequest}
              onChange={onAdministrationChange}
              isValid={isValid}
              productType={productType}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export function MedicineAdminSheet({
  open,
  onOpenChange,
  medications,
  lastAdministeredDates,
  patientId,
  encounterId,
  selectedGroup,
  productType,
}: Props) {
  const { t } = useTranslation();

  const [selectedMedicines, setSelectedMedicines] = useState<Set<string>>(
    new Set(),
  );
  const [administrationRequests, setAdministrationRequests] = useState<
    Record<string, MedicationAdministrationRequest>
  >({});
  const [formValidation, setFormValidation] = useState<Record<string, boolean>>(
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Pre-select the latest active request when opening with a selectedGroup
  useEffect(() => {
    if (open && selectedGroup) {
      const latestRequest = getLatestActiveRequest(selectedGroup);
      if (latestRequest) {
        setSelectedMedicines(new Set([latestRequest.id]));
        setAdministrationRequests({
          [latestRequest.id]: createMedicationAdministrationRequest(
            latestRequest,
            encounterId,
          ),
        });
      }
    }
  }, [open, selectedGroup, encounterId]);

  const { mutate: upsertAdministrations, isPending } = useMutation({
    mutationFn: mutate(medicationAdministrationApi.upsert, {
      pathParams: { patientId },
    }),
    onSuccess: () => {
      toast.success(
        t(
          productType === ProductKnowledgeType.medication
            ? "medication_administration_saved"
            : "nutritional_product_administration_saved",
        ),
      );
      handleClose();
    },
  });

  const handleSelect = useCallback(
    (id: string, checked: boolean) => {
      setSelectedMedicines((prev) => {
        const next = new Set(prev);
        if (checked) {
          next.add(id);
          const medicine = medications.find((m) => m.id === id);
          if (medicine) {
            setAdministrationRequests((prev) => ({
              ...prev,
              [id]: createMedicationAdministrationRequest(
                medicine,
                encounterId,
              ),
            }));
          }
        } else {
          next.delete(id);
          setAdministrationRequests((prev) => {
            const { [id]: _, ...rest } = prev;
            return rest;
          });
        }
        return next;
      });
    },
    [medications, encounterId],
  );

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const administrations = Array.from(selectedMedicines).map(
      (id) => administrationRequests[id],
    );
    upsertAdministrations({
      datapoints: administrations,
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedMedicines(new Set());
    setAdministrationRequests({});
  };

  const handleAdministrationChange = useCallback(
    (medicineId: string, request: MedicationAdministrationRequest) => {
      setAdministrationRequests((prev) => ({
        ...prev,
        [medicineId]: request,
      }));
    },
    [],
  );

  const handleFormValidation = useCallback(
    (medicineId: string, isValid: boolean) => {
      setFormValidation((prev) => ({
        ...prev,
        [medicineId]: isValid,
      }));
    },
    [],
  );

  const isAllFormsValid = useMemo(
    () =>
      Array.from(selectedMedicines).every((id) => formValidation[id] !== false),
    [selectedMedicines, formValidation],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size="lg" className="overflow-hidden">
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <SheetHeader>
            <SheetTitle>
              {productType === ProductKnowledgeType.medication
                ? t("administer_medicines")
                : t("record_intake")}
            </SheetTitle>
          </SheetHeader>

          <SheetBody>
            <div className="space-y-2">
              {medications.map((medicine) => (
                <MedicineListItem
                  key={medicine.id}
                  medicine={medicine}
                  isSelected={selectedMedicines.has(medicine.id)}
                  onSelect={(checked) => handleSelect(medicine.id, checked)}
                  administrationRequest={administrationRequests[medicine.id]}
                  lastAdministeredDate={lastAdministeredDates?.[medicine.id]}
                  onAdministrationChange={(request) =>
                    handleAdministrationChange(medicine.id, request)
                  }
                  isValid={(valid) => handleFormValidation(medicine.id, valid)}
                  productType={productType}
                />
              ))}
            </div>
          </SheetBody>

          <SheetFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              className="bg-primary-700 hover:bg-primary-700/90"
              disabled={
                selectedMedicines.size === 0 || isPending || !isAllFormsValid
              }
              onClick={(e) => {
                e.preventDefault();
                handleSubmit(e as any);
              }}
            >
              {isPending
                ? t("saving")
                : `${
                    productType === ProductKnowledgeType.medication
                      ? t("administer_medicines")
                      : t("record_intake")
                  } (${selectedMedicines.size})`}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

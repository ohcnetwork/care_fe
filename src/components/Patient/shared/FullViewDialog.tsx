import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import QuestionnaireResponsesList from "@/components/Facility/ConsultationDetails/QuestionnaireResponsesList";
import { AllergyList } from "@/components/Patient/allergy/list";
import { DiagnosisList } from "@/components/Patient/diagnosis/list";
import { SymptomsList } from "@/components/Patient/symptoms/list";

import { Encounter } from "@/types/emr/encounter";

interface FullViewDialogProps {
  patientId: string;
  initialTab?: "allergies" | "symptoms" | "diagnoses" | "questionnaire";
  encounter?: Encounter;
  onClose?: () => void;
}

export function FullViewDialog({
  patientId,
  initialTab = "symptoms",
  encounter,
  onClose,
}: FullViewDialogProps) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  type Tabkey = "allergies" | "symptoms" | "diagnoses" | "questionnaire";
  const [activeTab, setActiveTab] = useState<Tabkey>(initialTab);
  const tabOrder = ["allergies", "symptoms", "diagnoses", "questionnaire"];

  useEffect(() => {
    return () => {
      if (onClose) {
        onClose();
      }
    };
  }, [onClose]);

  // Function to navigate to the previous tab
  const navigateToPreviousTab = () => {
    const currentIndex = tabOrder.indexOf(activeTab);
    const previousIndex =
      currentIndex > 0 ? currentIndex - 1 : tabOrder.length - 1;
    setActiveTab(tabOrder[previousIndex] as typeof activeTab);
  };
  // Function to navigate to the next tab
  const navigateToNextTab = () => {
    const currentIndex = tabOrder.indexOf(activeTab);
    const nextIndex = (currentIndex + 1) % tabOrder.length;
    setActiveTab(tabOrder[nextIndex] as typeof activeTab);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div>
          <div className="border-b border-dashed border-gray-200 my-2" />
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="xs"
              className="text-xs underline text-gray-950"
            >
              {t("view_all")}
            </Button>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[80vw] w-full max-w-full max-h-[90vh] overflow-y-auto p-0">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as typeof activeTab)}
          className="w-full"
        >
          <div className="flex flex-col sm:flex-row items-center border-none w-full justify-between pt-10 sm:pt-0">
            <div className="w-full sm:w-auto overflow-visible">
              <TabsList className="justify-start rounded-none gap-2 sm:gap-6 bg-transparent h-auto sm:h-12 mx-2 sm:ml-8 px-1 sm:px-8 w-full sm:w-auto flex-wrap overflow-visible">
                <TabsTrigger
                  value="allergies"
                  className="px-2 py-3 text-sm sm:text-base text-black leading-none tracking-tight rounded-none data-[state=active]:border-b-2 data-[state=active]:border-green-800 data-[state=active]:text-green-800 data-[state=active]:font-semibold"
                >
                  {t("allergies")}
                </TabsTrigger>
                <TabsTrigger
                  value="symptoms"
                  className="px-2 py-3 text-sm sm:text-base text-black rounded-none leading-none tracking-tight data-[state=active]:border-b-2 data-[state=active]:border-green-800 data-[state=active]:text-green-800 data-[state=active]:font-semibold"
                >
                  {t("symptoms")}
                </TabsTrigger>
                <TabsTrigger
                  value="diagnoses"
                  className="px-2 py-3 text-sm sm:text-base text-black rounded-none leading-none tracking-tight data-[state=active]:border-b-2 data-[state=active]:border-green-800 data-[state=active]:text-green-800 data-[state=active]:font-semibold"
                >
                  {t("diagnoses")}
                </TabsTrigger>
                <TabsTrigger
                  value="questionnaire"
                  className="px-2 py-3 text-sm sm:text-base text-black rounded-none leading-none tracking-tight data-[state=active]:border-b-2 data-[state=active]:border-green-800 data-[state=active]:text-green-800 data-[state=active]:font-semibold"
                >
                  {t("questionnaire_responses")}
                </TabsTrigger>
              </TabsList>
            </div>
            <div className="flex items-center px-2 sm:px-4 gap-2 mt-2 sm:mt-0 sm:mr-6">
              <Button
                variant="outline"
                size="sm"
                className="p-1 h-8 w-8 sm:h-10 sm:w-10"
                onClick={navigateToPreviousTab}
              >
                <ChevronLeft
                  strokeWidth={2}
                  size={16}
                  className="sm:w-6 sm:h-6"
                />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="p-1 h-8 w-8 sm:h-10 sm:w-10"
                onClick={navigateToNextTab}
              >
                <ChevronRight
                  strokeWidth={2}
                  size={16}
                  className="sm:w-6 sm:h-6"
                />
              </Button>
            </div>
          </div>
          <div className="p-2 sm:p-4">
            <TabsContent value="allergies" className="mt-0">
              <div className="mt-4">
                <AllergyList
                  patientId={patientId}
                  encounter={encounter}
                  dialogView={true}
                />
              </div>
            </TabsContent>

            <TabsContent value="symptoms" className="mt-0">
              <div className="mt-4">
                <SymptomsList
                  patientId={patientId}
                  encounter={encounter}
                  dialogView={true}
                />
              </div>
            </TabsContent>

            <TabsContent value="diagnoses" className="mt-0">
              <div className="mt-4">
                <DiagnosisList
                  patientId={patientId}
                  encounter={encounter}
                  dialogView={true}
                />
              </div>
            </TabsContent>

            <TabsContent value="questionnaire" className="mt-0">
              <div className="mt-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2">
                  <div>
                    <h1 className="text-xl font-semibold">
                      {t("consultation")}
                    </h1>
                    <p className="text-muted-foreground mb-2">
                      {t("consultation_detail")}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="mt-4 md:mt-0 border-black text-black hover:bg-green-50 hover:text-green-700 w-full md:w-auto"
                  >
                    {t("update_questionnaire")}
                  </Button>
                </div>
                <div className="mb-8">
                  <div className="mb-1 text-sm text-muted-foreground">
                    {t("date_and_time_of_assessment")}
                  </div>
                  <div className="text-base">
                    {encounter?.period.start &&
                      format(new Date(encounter.period.start), "PPp")}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-4 mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-sm bg-gray-200 text-black text-xs sm:text-sm"
                  >
                    {t("clinical_history")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-sm bg-gray-200 text-black text-xs sm:text-sm"
                  >
                    {t("examination")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-sm bg-gray-200 text-black text-xs sm:text-sm"
                  >
                    {t("symptoms")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-sm bg-gray-200 text-black text-xs sm:text-sm"
                  >
                    {t("diagnosis")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-sm bg-gray-200 text-black text-xs sm:text-sm"
                  >
                    {t("advise_medicine")}
                  </Button>
                </div>
                <QuestionnaireResponsesList
                  encounter={encounter}
                  patientId={patientId}
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

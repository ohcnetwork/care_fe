import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { dailyRoundsAnalyse } from "../../../Redux/actions";

export interface ITelePatientVitalsGraphCardProps {
  consultationId?: number;
}

export default function TelePatientVitalsGraphCard({
  consultationId,
}: ITelePatientVitalsGraphCardProps) {
  const [analysis, setAnalysis] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const dispatch: any = useDispatch();

  useEffect(() => {
    dispatch(
      dailyRoundsAnalyse({ fields: ["pulse"] }, { consultationId })
    ).then((response: any) => {
      if (response?.data) {
        setAnalysis(response.data?.results || {});
      }
      setIsLoading(false);
    });
  }, [consultationId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center flex-col flex-1">
        <i className="fas fa-chart-pie animate-pulse text-primary-700 text-3xl"></i>
        <p className="text-sm text-primary-700 my-2">Loading analysis...</p>
      </div>
    );
  }

  return (
    <div className="lg:w-6/12 w-full text-white flex items-center justify-center lg:h-auto h-96 rounded-b-md lg:rounded-b-none">
      <div className="flex items-center justify-center flex-col flex-1">
        {/* Image with gray overlay */}
        {/* <img
          className="opacity-75 p-4"
          src={"/images/vitals_graph.png"}
          alt={"Vitals Graph"}
        /> */}
        <i className="fas fa-chart-pie text-primary-700 text-3xl"></i>
        <p className="text-sm text-primary-600 my-4">
          Data Not Enough for Analysis
        </p>
      </div>
    </div>
  );
}

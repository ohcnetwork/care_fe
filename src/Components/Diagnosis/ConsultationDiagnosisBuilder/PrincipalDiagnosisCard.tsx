import { ICD11DiagnosisModel } from "../types";

interface Props {
  className?: string;
  diagnosis: ICD11DiagnosisModel;
}

export default function PrincipalDiagnosisCard(props: Props) {
  return (
    <div className={props.className}>
      <div className="rounded-lg border border-gray-400 bg-gray-200 p-4">
        <h3 className="text-lg font-semibold">Principal Diagnosis</h3>
        <span className="mt-2 flex w-full flex-col items-center gap-2 text-center text-gray-900">
          <span className="cui-input-base text-base font-bold">
            {props.diagnosis.label}
          </span>
          <span className="flex flex-wrap gap-x-1 px-2">
            <p>This encounter will be categorised under:</p>
            <p className="font-bold">{props.diagnosis.chapter}</p>
          </span>
        </span>
      </div>
    </div>
  );
}

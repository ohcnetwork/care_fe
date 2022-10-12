import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { getConsultation } from "../../../Redux/actions";
import { formatDate } from "../../../Utils/utils";
import { InvestigationType } from "../../Common/prescription-builder/InvestigationBuilder";

export default function ViewInvestigationSuggestions(props: {
    consultationId : any,
}) {

    const { consultationId } = props;
    const dispatch = useDispatch();

    const [investigations, setInvestigations] = useState<InvestigationType[] | null>(null);

    useEffect(()=>{
        getConsultationData();
    },[consultationId])

    const getConsultationData = async () => {
        const res = (await dispatch(getConsultation(consultationId))) as any;
        setInvestigations(res.data.investigation || []);
    }

    return (
        <div className="mt-5">
            <h3>
                Investigation Suggestions
            </h3>
            <table className="hidden md:table w-full bg-white shadow rounded-xl mt-3">
                <thead className="text-left bg-gray-200">
                    <tr>
                        <th className="p-4">
                            Investigations
                        </th>
                        <th className="p-4">
                            To be conducted
                        </th>
                        <th className="p-4">
                            Notes
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {Array.isArray(investigations) ? investigations.map((investigation, index) => (
                        <tr key={index} className="border-b border-b-gray-200">
                            <td className="p-4">
                                <ul className="list-decimal ml-4">
                                    {investigation.type?.map((type, index) => (
                                        <li key={index}>
                                            {type}
                                        </li>
                                    ))}
                                </ul>
                            </td>
                            <td className="p-4">
                                {investigation.repetitive ? (
                                    <div>
                                        after every {investigation.frequency}
                                    </div>
                                ) : (
                                    <div>
                                        at {investigation.time ? formatDate(investigation.time) : "--:--"}
                                    </div>
                                )}
                            </td>
                            <td className="p-4">
                                {investigation.notes}
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td className="p-4" colSpan={3}>
                                No Investigation Suggestions
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
            <div className="flex flex-col gap-4 md:hidden">
                {Array.isArray(investigations) ? investigations.map((investigation, index) => (
                    <div key={index} className="bg-white shadow rounded-xl p-4">
                        <b>Investigations :</b>
                        <ul className="list-decimal ml-4">
                            {investigation.type?.map((type, index) => (
                                <li key={index}>
                                    {type}
                                </li>
                            ))}
                        </ul>
                        <br />
                        <b>To be conducted&nbsp;
                        {investigation.repetitive ? (
                            <>
                                after every {investigation.frequency}
                            </>
                        ) : (
                            <>
                                at {investigation.time ? formatDate(investigation.time) : "--:--"}
                            </>
                        )}
                        </b>
                        <br />
                        <br />
                        <b>Notes :</b>
                        <br /> 
                        {investigation.notes || "none"}
                    </div>
                )) : (
                    <div className="bg-white shadow rounded-xl">
                        No Investigation Suggestions
                    </div>
                )}                
            </div>
        </div>
    )
}
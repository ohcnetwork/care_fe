import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { listInvestigationGroups, listInvestigations } from "../../../Redux/actions";
import { PrescriptionDropdown } from "./PrescriptionDropdown";
import { PrescriptionMultiDropdown } from "./PrescriptionMultiselect";

export type InvestigationType = {
    type?: string[]; 
    repetitive?: boolean;
    time? : string;
    frequency? : string; 
    notes?: string;
}

const FREQUENCY = ["15 min", "30 min", "1 hr", "6 hrs", "12 hrs", "24 hrs", "48 hrs"];

export interface InvestigationBuilderProps<T> {
    investigations :T[], 
    setInvestigations : React.Dispatch<React.SetStateAction<T[]>>
};

export default function InvestigationBuilder(props : InvestigationBuilderProps<InvestigationType>){

    const {investigations, setInvestigations} = props;
    const [investigationsList, setInvestigationsList] = useState<string[]>([]);
    const dispatch: any = useDispatch();

    const additionalInvestigations = [
        [
            "Vitals",
            [
                "Temp",
                "Blood",
                "Pressure",
                "Respiratory Rate", 
                "Pulse Rate"
            ]
        ],
        [
            "ABG",
            [
                "PO2",
                "PCO2", 
                "PH", 
                "HCO3", 
                "Base excess",
                "Lactate", 
                "Sodium", 
                "Potassium"
            ]
        ]
    ]

    const setItem = (object : InvestigationType, i : number) => {
        setInvestigations(investigations.map((investigation, index)=>
            index === i ? object : investigation
        ))
    }

    useEffect(()=>{
        loadInvestigations();
    }, [])

    const loadInvestigations = async () => {
        const invs = await fetchInvestigations();
        const groups = await fetchInvestigationGroups();

        let additionalStrings : string[] = [];
        additionalInvestigations.forEach((investigation)=>{
            additionalStrings.push((investigation[0] as string) + " (GROUP)");
            additionalStrings = [...additionalStrings, ...((investigation[1] as string[]).map((i : any) => i + " -- ( " + investigation[0] + " )"))]
        });

        setInvestigationsList([
            ...groups,
            ...invs,
            ...additionalStrings
        ])
    }

    const fetchInvestigations = async () => {
        const res = await dispatch(listInvestigations({}));
        if (res && res.data) {
             return res.data.results.map((investigation : any) => investigation.name + " -- " + investigation.groups.map((group : any) => " ( " + group.name + " ) ").join(", "));
        }
        return [];
    };
    
    const fetchInvestigationGroups = async () => {
        const res = await dispatch(listInvestigationGroups({}));
        if (res && res.data) {
            return res.data.results.map((group : any) => group.name + " (GROUP)");
        }
        return [];
    };

    return (
        <div className="mt-2">
            {
                investigations.map((investigation, i)=>{

                    const setFrequency = (frequency : string) => {
                        setItem({
                            ...investigation,
                            frequency
                        },i)
                    }

                    const setType = (type : string[]) => {
                        setItem({
                            ...investigation,
                            type
                        },i)
                    }

                    return (
                        <div key={i} className="border-b border-b-gray-500 border-dashed py-2 text-xs text-gray-600">
                            <div className="flex gap-2 flex-col md:flex-row">
                                <div
                                    className="w-full"    
                                >
                                    Investigations Recommended
                                    <PrescriptionMultiDropdown
                                        options={investigationsList}
                                        placeholder="Search Investigations"
                                        selectedValues={investigation.type?.constructor === Array ? investigation.type : []}
                                        setSelectedValues={setType}
                                    />
                                </div>
                                <div className="flex flex-col w-full md:w-[250px] shrink-0 justify-between">
                                    <div className="flex gap-2">
                                        <div
                                            className="shrink-0"    
                                        >
                                            Repetitive
                                            <br />
                                            <input 
                                                type="checkbox"
                                                className="mt-2 inline-block"
                                                checked={investigation?.repetitive || false}
                                                onChange={(e)=>{
                                                    setItem({
                                                        ...investigation,
                                                        repetitive: e.currentTarget.checked
                                                    }, i)
                                                }}
                                            />
                                        </div>
                                        {investigation.repetitive ? (
                                            <div
                                                className="w-full"    
                                            >
                                                Frequency
                                                <PrescriptionDropdown
                                                    placeholder="Frequency"
                                                    options={FREQUENCY}
                                                    value={investigation.frequency || ""}
                                                    setValue={setFrequency}
                                                />
                                            </div>
                                        ) : (
                                            <div
                                                className="w-full"
                                            >
                                                Time
                                                <input
                                                    type="datetime-local"
                                                    className="w-[calc(100%-5px)] focus:ring-primary-500 focus:border-primary-500 block border border-gray-400 rounded py-2 px-4 text-sm bg-gray-100 hover:bg-gray-200 focus:outline-none focus:bg-white"
                                                    value={investigation.time || ""}
                                                    onChange={(e)=>{
                                                        setItem({
                                                            ...investigation,
                                                            time: e.currentTarget.value
                                                        }, i)
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div
                                        className="w-full"    
                                    >
                                        Notes
                                        <input
                                            type="text"
                                            className="w-full focus:ring-primary-500 focus:border-primary-500 block border border-gray-400 rounded py-2 px-4 text-sm bg-gray-100 hover:bg-gray-200 focus:outline-none focus:bg-white"
                                            placeholder="Notes"
                                            value={investigation.notes || ""}
                                            onChange={(e)=>{
                                                setItem({
                                                    ...investigation,
                                                    notes : e.currentTarget.value
                                                }, i)
                                            }}
                                        />
                                    </div>
                                </div>
                                
                                <button
                                    type="button"
                                    className="text-gray-400 text-base transition hover:text-red-500"
                                    onClick={()=>setInvestigations(investigations.filter((investigation, index)=>i!=index))}
                                >
                                    <i className="fas fa-trash" />
                                </button>
                            </div>
                        </div>
                    )
                })
            }
            <button
                type="button"
                onClick={()=>{
                    setInvestigations([
                        ...investigations,
                        {repetitive : false}
                    ])
                }}
                className="shadow-sm mt-4 bg-gray-200 w-full font-bold block px-4 py-2 text-sm leading-5 text-left text-gray-700 hover:bg-gray-300 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900"
            >
                + Add Investigation
            </button>
        </div>
    )
}
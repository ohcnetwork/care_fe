import { medicines, routes, units } from "./PrescriptionBuilder";
import { PrescriptionDropdown } from "./PrescriptionDropdown";

export type InvestigationType = {
    type?: any; 
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

    const setItem = (object : InvestigationType, i : number) => {
        setInvestigations(investigations.map((investigation, index)=>
            index === i ? object : investigation
        ))
    }
    
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

                    const setType = (type : string) => {
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
                                    Investigation Recommended
                                    <PrescriptionDropdown
                                        placeholder="Investigation"
                                        options={["ABP"]}
                                        value={investigation.type || ""}
                                        setValue={setType}
                                    />
                                </div>
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
                                        className="w-[80px] shrink-0"    
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
                                        className="w-[170px] shrink-0"
                                    >
                                        Time
                                        <input
                                            type="datetime-local"
                                            className="w-full focus:ring-primary-500 focus:border-primary-500 block border border-gray-400 rounded py-2 px-4 text-sm bg-gray-100 hover:bg-gray-200 focus:outline-none focus:bg-white"
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
                        {}
                    ])
                }}
                className="shadow-sm mt-4 bg-gray-200 w-full font-bold block px-4 py-2 text-sm leading-5 text-left text-gray-700 hover:bg-gray-300 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900"
            >
                + Add Investigation
            </button>
        </div>
    )
}
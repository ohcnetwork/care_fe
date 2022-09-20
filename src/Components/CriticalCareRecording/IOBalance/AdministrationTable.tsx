import { PrescriptionType } from "../../Common/prescription-builder/PrescriptionBuilder";
import { PRNPrescriptionType } from "../../Common/prescription-builder/PRNPrescriptionBuilder";

export function PrescriptionAdministrationTable(props : {prescription : PrescriptionType, record : any, setRecord : any, discontinued? : boolean}) {

    const {prescription, record, setRecord, discontinued} = props;

    return (
        <div>
            {discontinued && <div className="text-red-600">DISCONTINUED</div>}
        </div>
    )
}

export function PRNPrescriptionAdministrationTable(props : {prescription : PRNPrescriptionType, PRNrecord : any, setPRNrecord : any, discontinued? : boolean}) {

    const {prescription, PRNrecord, setPRNrecord, discontinued} = props;

    if(discontinued) {
        return (
            <div className="w-full flex justify-center items-center">
                <div className="text-center">
                    <div className="text-red-500"> <i className="fas fa-triangle-exclamation" /> DISCONTINUED</div>
                    <div>
                        Administered from 
                    </div>
                </div>
                
            </div>
        )
    }else{
        return (
            <div className="w-full">
                
            </div>
        )
    }

    
}
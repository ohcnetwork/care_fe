import { useState } from "react";

import ConfirmDialog from "@/components/Common/ConfirmDialog";
import { FacilitySelect } from "@/components/Common/FacilitySelect";
import { FacilityModel } from "@/components/Facility/models";

interface Props {
  username: string;
  handleOk: (
    username: string,
    facility: FacilityModel | FacilityModel[] | null,
  ) => void;
  handleCancel: () => void;
}

const LinkFacilityDialog = ({ username, handleOk, handleCancel }: Props) => {
  const [facility, setFacility] = useState<any>(null);

  return (
    <ConfirmDialog
      show
      title={
        <span>
          Link new facility to <strong>{username}</strong>
        </span>
      }
      description={
        <div className="md:min-w-[400px]">
          <FacilitySelect
            multiple={false}
            name="facility"
            showAll={false} // Show only facilities that user has access to link (not all facilities)
            showNOptions={8}
            selected={facility}
            setSelected={setFacility}
            errors=""
            className="z-40"
          />
        </div>
      }
      action="Link"
      variant="primary"
      onClose={handleCancel}
      onConfirm={() => handleOk(username, facility)}
      disabled={!facility}
    />
  );
};

export default LinkFacilityDialog;

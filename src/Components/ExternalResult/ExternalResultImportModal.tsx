import _ from "lodash-es";
import { navigate } from "raviger";
import { useEffect, useState, lazy } from "react";
import useConfig from "../../Common/hooks/useConfig";
import * as Notification from "../../Utils/Notifications.js";
import request from "../../Utils/request/request";
import routes from "../../Redux/api";
import { ExternalResultImportSchema } from "../../Common/constants";
import DialogModal from "../Common/Dialog";
import { IExternalResult } from "./models";
const ExcelFileDragAndDrop = lazy(
  () => import("../Common/ExcelFIleDragAndDrop")
);

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ExternalResultImportModal({ open, onClose }: Props) {
  const { sample_format_external_result_import } = useConfig();
  const [loading, setLoading] = useState(false);

  const fetchUser = async () => {
    const { data: user } = await request(routes.currentUser, {
      pathParams: {},
    });

    ExternalResultImportSchema.Address.parse = (value: string) => {
      if (
        user?.user_type === "StateAdmin" ||
        user?.user_type === "StateLabAdmin"
      ) {
        if (value.split(",").pop()?.trim() === user?.state_object?.name) {
          return value;
        } else {
          throw new Error("State should be the same as the user's state");
        }
      }
      return value;
    };

    ExternalResultImportSchema.District.parse = (value: string) => {
      if (
        user?.user_type === "StateAdmin" ||
        user?.user_type === "StateLabAdmin"
      ) {
        return value;
      } else if (value !== user?.district_object?.name) {
        throw new Error("District should be the same as the user's district");
      }
    };
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleSubmit = async (data: IExternalResult[]) => {
    setLoading(true);

    if (data.length !== 0) {
      try {
        const { res } = await request(routes.externalResultUploadCsv, {
          body: {
            sample_tests: data,
          },
        });

        if (res && res.status === 202) {
          setLoading(false);
          navigate("/external_results");
          Notification.Success({
            msg: "External Results imported successfully",
          });
        } else {
          Notification.Error({
            msg: "Something went wrong",
          });
          setLoading(false);
        }
      } catch (error) {
        Notification.Error({
          msg: "Something went wrong: " + error,
        });
        setLoading(false);
      } finally {
        setLoading(false);
        onClose();
      }
    } else {
      setLoading(false);
    }
  };

  return (
    <DialogModal
      title="Import External Results"
      show={open}
      onClose={onClose}
      className="w-[48rem]"
      fixedWidth={false}
    >
      <ExcelFileDragAndDrop
        onClose={onClose}
        handleSubmit={handleSubmit}
        loading={loading}
        sampleLink={sample_format_external_result_import}
        schema={ExternalResultImportSchema}
      />
    </DialogModal>
  );
}

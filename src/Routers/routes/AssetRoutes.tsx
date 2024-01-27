import AssetConfigure from "../../Components/Assets/AssetConfigure";
import AssetManage from "../../Components/Assets/AssetManage";
import AssetsList from "../../Components/Assets/AssetsList";
import AssetCreate from "../../Components/Facility/AssetCreate";
import {
  AuthorizeUserRoute,
  NonReadOnlyUsersList,
} from "../../Utils/AuthorizeFor";

export default {
  "/assets": () => <AssetsList />,

  "/facility/:facilityId/assets/new": (params: any) => (
    <AuthorizeUserRoute userTypes={NonReadOnlyUsersList}>
      <AssetCreate {...params} />
    </AuthorizeUserRoute>
  ),
  "/facility/:facilityId/assets/:assetId/update": (params: any) => (
    <AssetCreate {...params} />
  ),
  "/facility/:facilityId/assets/:assetId": (params: any) => (
    <AssetManage {...params} />
  ),
  "/facility/:facilityId/assets/:assetId/configure": (params: any) => (
    <AssetConfigure {...params} />
  ),
};

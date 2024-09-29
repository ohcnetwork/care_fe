import AssetConfigure from "../../Components/Assets/AssetConfigure";
import AssetManage from "../../Components/Assets/AssetManage";
import AssetsList from "../../Components/Assets/AssetsList";
import AssetCreate from "../../Components/Facility/AssetCreate";
import { AppRoutes } from "../AppRouter";

const AssetRoutes: AppRoutes = {
  "/assets": () => <AssetsList />,
  "/facility/:facilityId/assets/new": ({ facilityId }) => (
    <AssetCreate facilityId={facilityId} />
  ),
  "/facility/:facilityId/assets/:assetId/update": ({ facilityId, assetId }) => (
    <AssetCreate facilityId={facilityId} assetId={assetId} />
  ),
  "/facility/:facilityId/assets/:assetId": ({ facilityId, assetId }) => (
    <AssetManage facilityId={facilityId} assetId={assetId} />
  ),
  "/facility/:facilityId/assets/:assetId/configure": ({
    facilityId,
    assetId,
  }) => <AssetConfigure facilityId={facilityId} assetId={assetId} />,
};

export default AssetRoutes;

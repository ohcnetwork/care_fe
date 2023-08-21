import * as Notification from "../../Utils/Notifications.js";

import { AssetClass, AssetData, AssetType } from "../Assets/AssetTypes";
import { Cancel, Submit } from "../Common/components/ButtonV2";
import {
  LegacyRef,
  RefObject,
  createRef,
  lazy,
  useEffect,
  useReducer,
  useState,
} from "react";
import {
  createAsset,
  getAsset,
  listFacilityAssetLocation,
  updateAsset,
} from "../../Redux/actions";

import CareIcon from "../../CAREUI/icons/CareIcon";
import { FieldLabel } from "../Form/FormFields/FormField";
import { LocationSelect } from "../Common/LocationSelect";
import Page from "../Common/components/Page";
import PhoneNumberFormField from "../Form/FormFields/PhoneNumberFormField";
import QrReader from "react-qr-reader";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import SwitchV2 from "../Common/components/Switch";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import TextFormField from "../Form/FormFields/TextFormField";

import { navigate } from "raviger";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { parseQueryParams } from "../../Utils/primitives";
import useAppHistory from "../../Common/hooks/useAppHistory";
import { useDispatch } from "react-redux";
import useVisibility from "../../Utils/useVisibility";
import { validateEmailAddress } from "../../Common/validation";
import { dateQueryString } from "../../Utils/utils.js";
import dayjs from "../../Utils/dayjs";

const Loading = lazy(() => import("../Common/Loading"));

const formErrorKeys = [
  "name",
  "asset_type",
  "asset_class",
  "description",
  "is_working",
  "serial_number",
  "location",
  "vendor_name",
  "support_name",
  "support_phone",
  "support_email",
  "manufacturer",
  "warranty_amc_end_of_validity",
  "last_serviced_on",
  "notes",
];

const initError = formErrorKeys.reduce(
  (acc: { [key: string]: string }, key) => {
    acc[key] = "";
    return acc;
  },
  {}
);

const fieldRef = formErrorKeys.reduce(
  (acc: { [key: string]: RefObject<any> }, key) => {
    acc[key] = createRef();
    return acc;
  },
  {}
);

const initialState = {
  errors: { ...initError },
};

interface AssetProps {
  facilityId: string;
  assetId?: string;
}

const asset_create_reducer = (state = initialState, action: any) => {
  switch (action.type) {
    case "set_error": {
      return {
        ...state,
        errors: action.errors,
      };
    }
    default:
      return state;
  }
};

type AssetFormSection =
  | "General Details"
  | "Warranty Details"
  | "Service Details";

const AssetCreate = (props: AssetProps) => {
  const { goBack } = useAppHistory();
  const { facilityId, assetId } = props;

  let assetTypeInitial: AssetType;
  let assetClassInitial: AssetClass;

  const [state, dispatch] = useReducer(asset_create_reducer, initialState);
  const [name, setName] = useState("");
  const [asset_type, setAssetType] = useState<AssetType>();
  const [asset_class, setAssetClass] = useState<AssetClass>();
  const [not_working_reason, setNotWorkingReason] = useState("");
  const [description, setDescription] = useState("");
  const [is_working, setIsWorking] = useState<string | undefined>(undefined);
  const [serial_number, setSerialNumber] = useState("");
  const [vendor_name, setVendorName] = useState("");
  const [support_name, setSupportName] = useState("");
  const [support_phone, setSupportPhone] = useState("");
  const [support_email, setSupportEmail] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [locations, setLocations] = useState<{ name: string; id: string }[]>(
    []
  );
  const [asset, setAsset] = useState<AssetData>();
  const [facilityName, setFacilityName] = useState("");
  const [qrCodeId, setQrCodeId] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [warranty_amc_end_of_validity, setWarrantyAmcEndOfValidity] =
    useState<any>(null);
  const [last_serviced_on, setLastServicedOn] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const dispatchAction: any = useDispatch();
  const [isScannerActive, setIsScannerActive] = useState<boolean>(false);

  const [currentSection, setCurrentSection] =
    useState<AssetFormSection>("General Details");

  const [generalDetailsVisible, generalDetailsRef] = useVisibility();
  const [warrantyDetailsVisible, warrantyDetailsRef] = useVisibility(-300);
  const [serviceDetailsVisible, serviceDetailsRef] = useVisibility(-300);

  const sections = {
    "General Details": {
      iconClass: "fa-solid fa-circle-info",
      isVisible: generalDetailsVisible,
      ref: generalDetailsRef,
    },
    "Warranty Details": {
      iconClass: "fa-solid fa-barcode",
      isVisible: warrantyDetailsVisible,
      ref: warrantyDetailsRef,
    },
    "Service Details": {
      iconClass: "fas fa-tools",
      isVisible: serviceDetailsVisible,
      ref: serviceDetailsRef,
    },
  };

  useEffect(() => {
    setCurrentSection((currentSection) => {
      let sectionNow = currentSection;
      if (serviceDetailsVisible) sectionNow = "Service Details";
      if (warrantyDetailsVisible) sectionNow = "Warranty Details";
      if (generalDetailsVisible) sectionNow = "General Details";
      return sectionNow;
    });
  }, [generalDetailsVisible, warrantyDetailsVisible, serviceDetailsVisible]);

  useEffect(() => {
    setIsLoading(true);
    dispatchAction(
      listFacilityAssetLocation({}, { facility_external_id: facilityId })
    ).then(({ data }: any) => {
      if (data.count > 0) {
        setFacilityName(data.results[0].facility?.name);
        setLocations(data.results);
      }
      setIsLoading(false);
    });

    if (assetId) {
      setIsLoading(true);
      dispatchAction(getAsset(assetId)).then(({ data }: any) => {
        setAsset(data);
        setIsLoading(false);
      });
    }
  }, [assetId, dispatchAction, facilityId]);

  useEffect(() => {
    if (asset) {
      setName(asset.name);
      setDescription(asset.description);
      setLocation(asset.location_object.id);
      setAssetType(asset.asset_type);
      setAssetClass(asset.asset_class);
      setIsWorking(String(asset.is_working));
      setNotWorkingReason(asset.not_working_reason);
      setSerialNumber(asset.serial_number);
      setVendorName(asset.vendor_name);
      setSupportName(asset.support_name);
      setSupportEmail(asset.support_email);
      setSupportPhone(asset.support_phone);
      setQrCodeId(asset.qr_code_id);
      setManufacturer(asset.manufacturer);
      asset.warranty_amc_end_of_validity &&
        setWarrantyAmcEndOfValidity(asset.warranty_amc_end_of_validity);
      asset.last_serviced_on && setLastServicedOn(asset.last_serviced_on);
      setNotes(asset.notes);
    }
  }, [asset]);

  const validateForm = () => {
    const errors = { ...initError };
    let invalidForm = false;
    Object.keys(state.errors).forEach((field) => {
      switch (field) {
        case "name":
          if (!name) {
            errors[field] = "Asset name can't be empty";
            invalidForm = true;
          }
          return;
        case "is_working":
          if (is_working === undefined) {
            errors[field] = "Field is required";
            invalidForm = true;
          }
          return;
        case "location":
          if (!location || location === "0" || location === "") {
            errors[field] = "Select a location";
            invalidForm = true;
          }
          return;
        case "asset_type":
          if (!asset_type || asset_type == "NONE") {
            errors[field] = "Select an asset type";
            invalidForm = true;
          }
          return;
        case "support_phone": {
          if (!support_phone) {
            errors[field] = "Field is required";
            invalidForm = true;
          }
          // eslint-disable-next-line no-case-declarations
          const checkTollFree = support_phone.startsWith("1800");
          const supportPhoneSimple = support_phone
            .replace(/[^0-9]/g, "")
            .slice(2);
          if (supportPhoneSimple.length != 10 && !checkTollFree) {
            errors[field] = "Please enter valid phone number";
            invalidForm = true;
          } else if (
            (support_phone.length < 10 || support_phone.length > 11) &&
            checkTollFree
          ) {
            errors[field] = "Please enter valid phone number";
            invalidForm = true;
          }
          return;
        }
        case "support_email":
          if (support_email && !validateEmailAddress(support_email)) {
            errors[field] = "Please enter valid email id";
            invalidForm = true;
          }
          return;
        default:
          return;
      }
    });
    if (invalidForm) {
      dispatch({ type: "set_error", errors });
      const firstError = Object.keys(errors).find((key) => errors[key]);
      if (firstError) {
        fieldRef[firstError].current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
      return false;
    }
    dispatch({ type: "set_error", errors });
    return true;
  };

  const resetFilters = () => {
    setName("");
    setDescription("");
    setLocation("");
    setAssetType(assetTypeInitial);
    setAssetClass(assetClassInitial);
    setIsWorking("");
    setNotWorkingReason("");
    setSerialNumber("");
    setVendorName("");
    setSupportName("");
    setSupportEmail("");
    setSupportPhone("");
    setQrCodeId("");
    setManufacturer("");
    setWarrantyAmcEndOfValidity("");
    setLastServicedOn("");
    setNotes("");
    setWarrantyAmcEndOfValidity(null);
    setLastServicedOn(null);
  };

  const handleSubmit = async (e: React.SyntheticEvent, addMore: boolean) => {
    e.preventDefault();
    const validated = validateForm();
    if (validated) {
      setIsLoading(true);
      const data = {
        name: name,
        asset_type: asset_type,
        asset_class: asset_class || "",
        description: description,
        is_working: is_working,
        not_working_reason: is_working === "true" ? "" : not_working_reason,
        serial_number: serial_number,
        location: location,
        vendor_name: vendor_name,
        support_name: support_name,
        support_email: support_email,
        support_phone: support_phone.startsWith("1800")
          ? support_phone
          : parsePhoneNumberFromString(support_phone)?.format("E.164"),
        qr_code_id: qrCodeId !== "" ? qrCodeId : null,
        manufacturer: manufacturer,
        warranty_amc_end_of_validity: warranty_amc_end_of_validity
          ? dateQueryString(warranty_amc_end_of_validity)
          : null,
        last_serviced_on: last_serviced_on
          ? dateQueryString(last_serviced_on)
          : last_serviced_on,
        notes: notes,
      };
      if (!assetId) {
        const res = await dispatchAction(createAsset(data));
        if (res && res.data && res.status === 201) {
          Notification.Success({
            msg: "Asset created successfully",
          });
          if (!addMore) {
            goBack();
          } else {
            resetFilters();
            const pageContainer = window.document.getElementById("pages");
            pageContainer?.scroll(0, 0);
          }
        }
        setIsLoading(false);
      } else {
        const res = await dispatchAction(updateAsset(assetId, data));
        if (res && res.data && res.status === 200) {
          Notification.Success({
            msg: "Asset updated successfully",
          });
          goBack();
        }
        setIsLoading(false);
      }
    }
  };

  const parseAssetId = (assetUrl: string) => {
    try {
      const params = parseQueryParams(assetUrl);
      // QR Maybe searchParams "asset" or "assetQR"
      const assetId = params.asset || params.assetQR;
      if (assetId) {
        setQrCodeId(assetId);
        setIsScannerActive(false);
        return;
      }
    } catch (err) {
      console.error(err);
      Notification.Error({ msg: err });
    }
    Notification.Error({ msg: "Invalid Asset Id" });
    setIsScannerActive(false);
  };

  if (isLoading) return <Loading />;

  if (locations.length === 0) {
    return (
      <Page
        title={assetId ? "Update Asset" : "Create New Asset"}
        crumbsReplacements={{
          [facilityId]: { name: facilityName },
          assets: { style: "text-gray-200 pointer-events-none" },
          [assetId || "????"]: { name },
        }}
        backUrl={`/facility/${facilityId}`}
      >
        <section className="text-center">
          <h1 className="flex flex-col items-center py-10 text-6xl">
            <div className="flex h-40 w-40 items-center justify-center rounded-full bg-gray-200 p-5">
              <CareIcon className="care-l-map-marker text-green-600" />
            </div>
          </h1>
          <p className="text-gray-600">
            You need at least a location to create an assest.
          </p>
          <button
            className="btn-primary btn mt-5"
            onClick={() => navigate(`/facility/${facilityId}/location/add`)}
          >
            <i className="fas fa-plus mr-2 text-white"></i>
            Add Location
          </button>
        </section>
      </Page>
    );
  }

  if (isScannerActive)
    return (
      <div className="mx-auto my-2 flex w-full flex-col items-end justify-start md:w-1/2">
        <button
          onClick={() => setIsScannerActive(false)}
          className="btn btn-default mb-2"
        >
          <i className="fas fa-times mr-2"></i> Close Scanner
        </button>
        <QrReader
          delay={300}
          onScan={(assetId: any) => (assetId ? parseAssetId(assetId) : null)}
          onError={(e: any) =>
            Notification.Error({
              msg: e.message,
            })
          }
          style={{ width: "100%" }}
        />
        <h2 className="self-center text-center text-lg">Scan Asset QR!</h2>
      </div>
    );

  const sectionId = (section: AssetFormSection) =>
    section.toLowerCase().replace(" ", "-");

  const sectionTitle = (sectionTitle: AssetFormSection) => {
    const section = sections[sectionTitle];
    return (
      <div
        id={sectionId(sectionTitle)}
        className="col-span-6 -ml-2 mb-6 flex flex-row items-center"
        ref={section.ref as LegacyRef<HTMLDivElement>}
      >
        <i className={`${section.iconClass} mr-3 text-lg`} />
        <label className="text-lg font-bold text-gray-900">
          {sectionTitle}
        </label>
        <hr className="ml-6 flex-1 border border-gray-400" />
      </div>
    );
  };

  return (
    <div className="relative flex flex-col">
      <Page
        title={`${assetId ? "Update" : "Create"} Asset`}
        className="grow-0 pl-6"
        crumbsReplacements={{
          [facilityId]: { name: facilityName },
          assets: { style: "text-gray-200 pointer-events-none" },
          [assetId || "????"]: { name },
        }}
        backUrl={
          assetId
            ? `/facility/${facilityId}/assets/${assetId}`
            : `/facility/${facilityId}`
        }
      >
        <div className="top-0 mt-5 flex grow-0 sm:mx-auto">
          <div className="fixed mt-4 hidden h-full w-72 flex-col xl:flex">
            {Object.keys(sections).map((sectionTitle) => {
              const isCurrent = currentSection === sectionTitle;
              const section = sections[sectionTitle as AssetFormSection];
              return (
                <button
                  className={`flex w-full items-center justify-start gap-3 rounded-l-lg px-5 py-3 font-medium ${
                    isCurrent ? "bg-white text-primary-500" : "bg-transparent"
                  } transition-all duration-100 ease-in hover:bg-white hover:tracking-wider`}
                  onClick={() => {
                    section.ref.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                    setCurrentSection(sectionTitle as AssetFormSection);
                  }}
                >
                  <i className={`${section.iconClass} text-sm`} />
                  <span>{sectionTitle}</span>
                </button>
              );
            })}
          </div>
          <div className="flex h-full w-full overflow-auto xl:ml-72">
            <div className="w-full max-w-3xl 2xl:max-w-4xl">
              <form
                onSubmit={(e) => handleSubmit(e, false)}
                className="rounded bg-white p-6 transition-all sm:rounded-xl sm:p-12"
              >
                <div className="grid grid-cols-1 items-start gap-x-12">
                  <div className="grid grid-cols-6 gap-x-6">
                    {/* General Details Section */}
                    {sectionTitle("General Details")}
                    {/* Asset Name */}
                    <div
                      className="col-span-6"
                      ref={fieldRef["name"]}
                      data-testid="asset-name-input"
                    >
                      <TextFormField
                        name="name"
                        label="Asset Name"
                        required
                        value={name}
                        onChange={({ value }) => setName(value)}
                        error={state.errors.name}
                      />
                    </div>

                    {/* Location */}
                    <FieldLabel className="w-max text-sm" required>
                      Asset Location
                    </FieldLabel>
                    <div
                      ref={fieldRef["location"]}
                      className="col-span-6"
                      data-testid="asset-location-input"
                    >
                      <LocationSelect
                        name="Facilities"
                        setSelected={(selectedId) =>
                          setLocation((selectedId as string) || "")
                        }
                        selected={location}
                        showAll={false}
                        multiple={false}
                        facilityId={facilityId as unknown as number}
                        errors={state.errors.location}
                      />
                    </div>
                    {/* Asset Type */}
                    <div className="col-span-6 flex flex-col gap-x-12 transition-all lg:flex-row xl:gap-x-16">
                      <div
                        ref={fieldRef["asset_type"]}
                        className="flex-1"
                        data-testid="asset-type-input"
                      >
                        <SelectFormField
                          label="Asset Type"
                          name="asset_type"
                          required
                          options={[
                            {
                              title: "Internal",
                              description:
                                "Asset is inside the facility premises.",
                              value: AssetType.INTERNAL,
                            },
                            {
                              title: "External",
                              description:
                                "Asset is outside the facility premises.",
                              value: AssetType.EXTERNAL,
                            },
                          ]}
                          value={asset_type}
                          optionLabel={({ title }) => title}
                          optionDescription={({ description }) => description}
                          optionValue={({ value }) => value}
                          onChange={({ value }) => setAssetType(value)}
                          error={state.errors.asset_type}
                        />
                      </div>

                      {/* Asset Class */}
                      <div
                        ref={fieldRef["asset_class"]}
                        className="flex-1"
                        data-testid="asset-class-input"
                      >
                        <SelectFormField
                          disabled={!!(props.assetId && asset_class)}
                          name="asset_class"
                          label="Asset Class"
                          value={asset_class}
                          options={[
                            { title: "ONVIF Camera", value: AssetClass.ONVIF },
                            {
                              title: "HL7 Vitals Monitor",
                              value: AssetClass.HL7MONITOR,
                            },
                            {
                              title: "Ventilator",
                              value: AssetClass.VENTILATOR,
                            },
                          ]}
                          optionLabel={({ title }) => title}
                          optionValue={({ value }) => value}
                          onChange={({ value }) => setAssetClass(value)}
                          error={state.errors.asset_class}
                        />
                      </div>
                    </div>
                    {/* Description */}
                    <div
                      className="col-span-6"
                      data-testid="asset-description-input"
                    >
                      <TextAreaFormField
                        name="asset_description"
                        label="Description"
                        placeholder="Details about the equipment"
                        value={description}
                        onChange={({ value }) => setDescription(value)}
                        error={state.errors.description}
                      />
                    </div>
                    {/* Divider */}
                    <div
                      className="col-span-6"
                      data-testid="asset-divider-input"
                    >
                      <hr
                        className={
                          "transition-all " +
                          (is_working === "true"
                            ? "my-0 opacity-0"
                            : "my-4 opacity-100")
                        }
                      />
                    </div>
                    {/* Working Status */}
                    <div
                      ref={fieldRef["is_working"]}
                      className="col-span-6"
                      data-testid="asset-working-status-input"
                    >
                      <SwitchV2
                        className="col-span-6"
                        required
                        name="is_working"
                        label="Working Status"
                        options={["true", "false"]}
                        optionLabel={(option) => {
                          return (
                            {
                              true: "Working",
                              false: "Not Working",
                            }[option] || "undefined"
                          );
                        }}
                        optionClassName={(option) =>
                          option === "false" &&
                          "bg-danger-500 text-white border-danger-500 focus:ring-danger-500"
                        }
                        value={is_working}
                        onChange={setIsWorking}
                        error={state.errors.is_working}
                      />
                    </div>
                    {/* Not Working Reason */}
                    <div
                      className={
                        "col-span-6" +
                        ((is_working !== "false" && " hidden") || "")
                      }
                    >
                      <TextAreaFormField
                        name="not_working_reason"
                        label="Why the asset is not working?"
                        placeholder="Describe why the asset is not working"
                        value={not_working_reason}
                        onChange={(e) => setNotWorkingReason(e.value)}
                        error={state.errors.not_working_reason}
                      />
                    </div>
                    {/* Divider */}
                    <div className="col-span-6">
                      <hr
                        className={
                          "transition-all " +
                          (is_working === "true"
                            ? "my-0 opacity-0"
                            : "mb-7 opacity-100")
                        }
                      />
                    </div>
                    {/* Asset QR ID */}
                    <div className="col-span-6 flex flex-row items-center gap-3">
                      <div className="w-full" data-testid="asset-qr-id-input">
                        <TextFormField
                          id="qr_code_id"
                          name="qr_code_id"
                          placeholder=""
                          label="Asset QR ID"
                          value={qrCodeId}
                          onChange={(e) => setQrCodeId(e.value)}
                          error={state.errors.qr_code_id}
                        />
                      </div>
                      <div
                        className="ml-1 mt-1 flex h-10 cursor-pointer items-center justify-self-end rounded border border-gray-400 px-4 hover:bg-gray-200"
                        onClick={() => setIsScannerActive(true)}
                      >
                        <CareIcon className="care-l-focus cursor-pointer text-lg" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-6 gap-x-6">
                    {sectionTitle("Warranty Details")}

                    {/* Manufacturer */}
                    <div
                      className="col-span-6 sm:col-span-3"
                      ref={fieldRef["manufacturer"]}
                      data-testid="asset-manufacturer-input"
                    >
                      <TextFormField
                        id="manufacturer"
                        name="manufacturer"
                        label="Manufacturer"
                        value={manufacturer}
                        placeholder="Eg. XYZ"
                        onChange={(e) => setManufacturer(e.value)}
                        error={state.errors.manufacturer}
                      />
                    </div>

                    {/* Warranty / AMC Expiry */}
                    <div
                      className="col-span-6 sm:col-span-3"
                      ref={fieldRef["warranty_amc_end_of_validity"]}
                      data-testid="asset-warranty-input"
                    >
                      <TextFormField
                        name="WarrantyAMCExpiry"
                        value={warranty_amc_end_of_validity}
                        label="Warranty / AMC Expiry"
                        error={state.errors.warranty_amc_end_of_validity}
                        onChange={(event) => {
                          const value = dayjs(event.value);
                          const date = new Date(value.toDate().toDateString());
                          const today = new Date(new Date().toDateString());
                          if (date < today) {
                            Notification.Error({
                              msg: "Warranty / AMC Expiry date can't be in past",
                            });
                          } else {
                            setWarrantyAmcEndOfValidity(dateQueryString(value));
                          }
                        }}
                        type="date"
                        min={dayjs().format("YYYY-MM-DD")}
                      />
                    </div>

                    {/* Customer Support Name */}
                    <div
                      className="col-span-6 sm:col-span-3"
                      ref={fieldRef["support_name"]}
                      data-testid="asset-support-name-input"
                    >
                      <TextFormField
                        id="support-name"
                        name="support_name"
                        label="Customer Support Name"
                        placeholder="Eg. ABC"
                        value={support_name}
                        onChange={(e) => setSupportName(e.value)}
                        error={state.errors.support_name}
                      />
                    </div>

                    {/* Customer Support Number */}
                    <div
                      className="col-span-6 sm:col-span-3"
                      ref={fieldRef["support_phone"]}
                      id="customer-support-phone-div"
                    >
                      <PhoneNumberFormField
                        name="support_phone"
                        label="Customer support number"
                        required
                        value={support_phone}
                        onChange={(e) => setSupportPhone(e.value)}
                        error={state.errors.support_phone}
                        types={["mobile", "landline", "support"]}
                      />
                    </div>

                    {/* Customer Support Email */}
                    <div
                      className="col-span-6 sm:col-span-3"
                      ref={fieldRef["support_email"]}
                      data-testid="asset-support-email-input"
                    >
                      <TextFormField
                        id="support-email"
                        name="support_email"
                        label="Customer Support Email"
                        placeholder="Eg. mail@example.com"
                        value={support_email}
                        onChange={(e) => setSupportEmail(e.value)}
                        error={state.errors.support_email}
                      />
                    </div>

                    <div className="sm:col-span-3" />

                    {/* Vendor Name */}
                    <div
                      className="col-span-6 sm:col-span-3"
                      ref={fieldRef["vendor_name"]}
                      data-testid="asset-vendor-name-input"
                    >
                      <TextFormField
                        id="vendor-name"
                        name="vendor_name"
                        label="Vendor Name"
                        value={vendor_name}
                        placeholder="Eg. XYZ"
                        onChange={(e) => setVendorName(e.value)}
                        error={state.errors.vendor_name}
                      />
                    </div>

                    {/* Serial Number */}
                    <div
                      className="col-span-6 sm:col-span-3"
                      ref={fieldRef["serial_number"]}
                      data-testid="asset-serial-number-input"
                    >
                      <TextFormField
                        id="serial-number"
                        name="serial_number"
                        label="Serial Number"
                        value={serial_number}
                        onChange={(e) => setSerialNumber(e.value)}
                        error={state.errors.serial_number}
                      />
                    </div>

                    <div className="mt-6" />
                    {sectionTitle("Service Details")}

                    {/* Last serviced on */}
                    <div
                      className="col-span-6 sm:col-span-3"
                      ref={fieldRef["last_serviced_on"]}
                      data-testid="asset-last-serviced-on-input"
                    >
                      <TextFormField
                        name="last_serviced_on"
                        label="Last Serviced On"
                        className="mt-2"
                        value={last_serviced_on}
                        error={state.errors.last_serviced_on}
                        onChange={(date) => {
                          if (
                            dayjs(date.value).format("YYYY-MM-DD") >
                            new Date().toLocaleDateString("en-ca")
                          ) {
                            Notification.Error({
                              msg: "Last Serviced date can't be in future",
                            });
                          } else {
                            setLastServicedOn(
                              dayjs(date.value).format("YYYY-MM-DD")
                            );
                          }
                        }}
                        type="date"
                        max={dayjs(new Date()).format("YYYY-MM-DD")}
                      />
                    </div>

                    {/* Notes */}
                    <div
                      className="col-span-6 mt-6"
                      ref={fieldRef["notes"]}
                      data-testid="asset-notes-input"
                    >
                      <TextAreaFormField
                        name="notes"
                        label="Notes"
                        placeholder="Eg. Details on functionality, service, etc."
                        value={notes}
                        onChange={(e) => setNotes(e.value)}
                        error={state.errors.notes}
                      />
                    </div>
                  </div>

                  <div className="mt-12 flex flex-wrap justify-end gap-2">
                    <Cancel
                      onClick={() =>
                        navigate(
                          assetId
                            ? `/facility/${facilityId}/assets/${assetId}`
                            : `/facility/${facilityId}`
                        )
                      }
                    />
                    <Submit
                      onClick={(e) => handleSubmit(e, false)}
                      label={assetId ? "Update" : "Create Asset"}
                    />
                    {!assetId && (
                      <Submit
                        data-testid="create-asset-add-more-button"
                        onClick={(e) => handleSubmit(e, true)}
                        label="Create & Add More"
                      />
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Page>
    </div>
  );
};

export default AssetCreate;

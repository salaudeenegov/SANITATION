import React, { Fragment, useState, useEffect, useRef } from "react";
import { useParams, useHistory, useLocation } from "react-router-dom";
import TimePicker from "react-time-picker";
import {
  Dropdown,
  Header,
  MultiUploadWrapper,
  TextArea,
  InfoIcon,
  RadioButtons,
} from "@egovernments/digit-ui-react-components";
import {
  Card,
  CardLabel,
  CardLabelError,
  DetailsCard,
  TextInput,
  ActionBar,
  SubmitBar,
  Loader,
  Toast,
  StatusTable,
  Row,
  LabelFieldPair,
  Menu,
} from "@egovernments/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "react-query";
import ActionModal from "./ApplicationDetails/Modal/index";

const config = {
  select: (data) => {
    return data.vehicleTrip[0];
  },
};

const totalconfig = {
  select: (data) => {
    return data.vehicleTrip;
  },
};

const FstpOperatorDetails = () => {
  const stateId = Digit.ULBService.getStateId();
  let isMobile = window.Digit.Utils.browser.isMobile();
  const { t } = useTranslation();
  const history = useHistory();
  const queryClient = useQueryClient();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const state = Digit.ULBService.getStateId();
  let { id: applicationNos } = useParams();
  const isNew = history.location.pathname.includes("new") ? true : false;
  const { data: urcConfig } = Digit.Hooks.fsm.useMDMS(
    tenantId,
    "FSM",
    "UrcConfig"
  );
  const isUrcEnable =
    urcConfig && urcConfig.length > 0 && urcConfig[0].URCEnable;
  const inputs = [
    {
      active: true,
      code: "WITHIN_ULB_LIMITS",
      i18nKey: "WITHIN_ULB_LIMITS",
      name: "Witnin ULB Limits",
    },
    {
      active: true,
      code: "FROM_GRAM_PANCHAYAT",
      i18nKey: "FROM_GRAM_PANCHAYAT",
      name: "From Gram Panchayat",
    },
  ];
  const [filters, setFilters] = useState(
    applicationNos != undefined
      ? { applicationNos }
      : { applicationNos: "null" }
  );
  const [isVehicleSearchCompleted, setIsVehicleSearchCompleted] =
    useState(false);
  const [searchParams, setSearchParams] = useState({});
  const [showToast, setShowToast] = useState(null);
  const [wasteCollected, setWasteCollected] = useState(null);
  const [errors, setErrors] = useState({});
  // const [tripStartTime, setTripStartTime] = useState(null);
  const [tripTime, setTripTime] = useState(() => {
    const today = new Date();
    const hour = (today.getHours() < 10 ? "0" : "") + today.getHours();
    const minutes = (today.getMinutes() < 10 ? "0" : "") + today.getMinutes();
    return `${hour}:${minutes}`;
  });
  const [displayMenu, setDisplayMenu] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [tripNo, setTripNo] = useState();
  const [appId, setAppId] = useState();
  const [filterVehicle, setFilterVehicle] = useState();
  const [currentTrip, setCurrentTrip] = useState();
  const wasteRecievedRef = useRef();
  // const tripStartTimeRef = useRef();
  // const tripTimeRef = useRef();
  const [fileStoreId, setFileStoreId] = useState();
  const [file, setFile] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(Array);
  const [error, setError] = useState(null);
  const [newVehicleNumber, setNewVehicleNumber] = useState(applicationNos);
  const [newLocality, setNewLocality] = useState(null);
  const [newDsoName, setNewDsoName] = useState(null);
  const [comments, setComments] = useState();
  const location = useLocation();
  const [selectLocation, setSelectLocation] = useState(inputs[0]);
  const [gramPanchayats, setGramPanchayats] = useState();
  const [selectedGp, setSelectedGp] = useState(null);
  const [villages, setVillages] = useState();
  const [selectedVillage, setSelectedVillage] = useState();
  const [newGramPanchayat, setNewGramPanchayat] = useState();
  const [newVillage, setNewVillage] = useState();
  const [selectedCity, setSelectedCity] = useState(
    Digit.SessionStorage.get("Employee.tenantId") || null
  );
  console.log(selectedCity, "sssss");

  const onChangeVehicleNumber = (value) => {
    setNewVehicleNumber(value);
  };

  const onChangeDsoName = (value) => {
    setNewDsoName(value);
  };

  const onChangeLocality = (value) => {
    setNewLocality(value);
  };

  const {
    isLoading: totalload,
    isSuccess: totalsuccess,
    data: totalvehicle,
  } = Digit.Hooks.fsm.useVehicleSearch({ tenantId, totalconfig });

  const {
    isLoading,
    isSuccess,
    data: vehicle,
  } = Digit.Hooks.fsm.useVehicleSearch({ tenantId, filters, config });

  const {
    isLoading: isSearchLoading,
    isIdle,
    data: { data: { table: tripDetails } = {} } = {},
  } = Digit.Hooks.fsm.useSearchAll(tenantId, searchParams, null, {
    enabled: !!isVehicleSearchCompleted,
  });
  var { data: fetchedGramPanchayats } = Digit.Hooks.useBoundaryLocalities(
    selectedCity,
    "gramPanchayats",
    {
      enabled: !!selectedCity,
    },
    t
  );

  useEffect(() => {
    if (fetchedGramPanchayats && fetchedGramPanchayats.length > 0) {
      fetchedGramPanchayats.push({
        code: "OTHER",
        name: "Other",
        i18nkey: tenantId.replace(".", "_").toUpperCase() + "_OTHER",
      });
      setGramPanchayats(fetchedGramPanchayats);
    }
  }, [fetchedGramPanchayats]);

  useEffect(() => {
    filterVehicle?.length == 0
      ? setCurrentTrip(1)
      : setCurrentTrip(tripNo - filterVehicle?.length + 1);
  }, [tripNo, filterVehicle, totalvehicle, totalsuccess, isSuccess]);

  const workflowDetails = Digit.Hooks.useWorkflowDetails({
    tenantId: tenantId,
    id: location.pathname.includes("fstp-operator-details")
      ? applicationNos
      : null,
    moduleCode: "FSM_VEHICLE_TRIP",
    role: "FSM_EMP_FSTPO",
  });

  const mutation = Digit.Hooks.fsm.useVehicleUpdate(tenantId);
  const create_mutation = Digit.Hooks.fsm.useVehicleTripCreate(tenantId);

  useEffect(() => {
    if (isSuccess) {
      setWasteCollected(vehicle?.vehicle?.tankCapacity);
      const applicationNos = vehicle?.tripDetails
        ?.map((tripData) => tripData.referenceNo)
        .join(",");
      setSearchParams(
        applicationNos ? { applicationNos } : { applicationNos: "null" }
      );
      setIsVehicleSearchCompleted(true);
    }
  }, [isSuccess]);

  useEffect(() => {
    if (!isIdle && !isSearchLoading && tripDetails) {
      setTripNo(tripDetails[0]?.noOfTrips);
      setAppId(tripDetails[0]?.applicationNo);
    }
  }, [isSearchLoading, isIdle, tripDetails]);

  useEffect(() => {
    switch (selectedAction) {
      case "DECLINEVEHICLE":
        return setShowModal(true);
      case "DISPOSE":
      case "READY_FOR_DISPOSAL":
        setSelectedAction(null);
        history.location.pathname.includes("new")
          ? handleCreate()
          : handleSubmit();
      default:
        setSelectedAction();
        break;
    }
  }, [selectedAction]);

  useEffect(() => {
    if (totalsuccess) {
      const temp = totalvehicle?.vehicleTrip?.filter(
        (c, i, r) =>
          c?.tripDetails[0]?.referenceNo === appId &&
          c?.applicationStatus === "WAITING_FOR_DISPOSAL"
      );
      setFilterVehicle(temp);
    }
  }, [totalsuccess, totalvehicle, isSuccess, isIdle, appId]);

  const handleSubmit = () => {
    const wasteCombined = tripDetails.reduce(
      (acc, trip) => acc + trip.volume,
      0
    );
    if (applicationNos) {
      if (!wasteCollected) {
        setErrors({ wasteRecieved: "ES_FSTP_INVALID_WASTE" });
        wasteRecievedRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        return;
      }
      if (
        wasteCollected > wasteCombined ||
        wasteCollected > vehicle.vehicle.tankCapacity
      ) {
        setErrors({ wasteRecieved: "ES_FSTP_INVALID_WASTE_AMOUNT" });
        wasteRecievedRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        return;
      }
    }
    // if (tripStartTime === null) {
    //   setErrors({ tripStartTime: "ES_FSTP_INVALID_START_TIME" });
    //   tripStartTimeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    //   return;
    // }

    // if (tripTime === null) {
    //   setErrors({ tripTime: "ES_FSTP_INVALID_TRIP_TIME" });
    //   tripTimeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    //   return;
    // }

    // if (tripStartTime === tripTime || tripStartTime > tripTime) {
    //   setErrors({ tripTime: "ES_FSTP_INVALID_TRIP_TIME" });
    //   tripTimeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    //   return;
    // }

    setErrors({});

    const d = new Date();
    const timeStamp =
      Date.parse(new Date(d.toString().split(":")[0].slice(0, -2) + tripTime)) /
      1000;
    // const tripStartTimestamp =
    //   Date.parse(
    //     new Date(d.toString().split(":")[0].slice(0, -2) + tripStartTime)
    //   ) / 1000;
    const tripDetail = { tripNo: currentTrip };
    // vehicle.tripStartTime = tripStartTimestamp;
    // vehicle.fstpEntryTime = tripStartTimestamp;
    vehicle.tripEndTime = timeStamp;
    vehicle.fstpExitTime = timeStamp;
    vehicle.volumeCarried = wasteCollected;
    vehicle.tripDetails[0].additionalDetails = tripDetail;
    vehicle.additionalDetails = {
      fileStoreId: uploadedFile,
      comments: comments,
    };

    const details = {
      vehicleTrip: [vehicle],
      workflow: {
        action: "DISPOSE",
      },
    };

    mutation.mutate(details, {
      onSuccess: handleSuccess,
      onError: handleError,
    });
  };

  const handleCreate = () => {
    const re = new RegExp(
      "^[A-Z]{2}\\s{1}[0-9]{2}\\s{0,1}[A-Z]{1,2}\\s{1}[0-9]{4}$"
    );
    if (!re.test(newVehicleNumber)) {
      setShowToast({ key: "error", action: `ES_FSM_VEHICLE_FORMAT_TIP` });
      setTimeout(() => {
        closeToast();
      }, 5000);
      return;
    }
    if (newDsoName === null || newDsoName?.trim()?.length === 0) {
      setShowToast({ key: "error", action: `ES_FSTP_INVALID_DSO_NAME` });
      setTimeout(() => {
        closeToast();
      }, 2000);
      return;
    }
    if (
      (selectLocation.code !== "FROM_GRAM_PANCHAYAT" && newLocality === null) ||
      newLocality?.trim()?.length === 0
    ) {
      setShowToast({ key: "error", action: `ES_FSTP_INVALID_LOCALITY` });
      setTimeout(() => {
        closeToast();
      }, 2000);
      return;
    }

    if (selectedGp === null) {
      setShowToast({ key: "error", action: `ES_FSTP_SELECT_GRAMPANCHAYAT` });
      setTimeout(() => {
        closeToast();
      }, 2000);
      return;
    }

    // if (tripStartTime === null) {
    //   setErrors({ tripStartTime: "ES_FSTP_INVALID_START_TIME" });
    //   tripStartTimeRef.current.scrollIntoView({
    //     behavior: "smooth",
    //     block: "center",
    //   });
    //   return;
    // }

    if (!wasteCollected || wasteCollected?.trim()?.length === 0) {
      setShowToast({ key: "error", action: `ES_FSTP_INVALID_WASTE` });
      setTimeout(() => {
        closeToast();
      }, 2000);
      return;
    }

    // if (tripTime === null) {
    //   setErrors({ tripTime: "ES_FSTP_INVALID_TRIP_TIME" });
    //   tripTimeRef.current.scrollIntoView({
    //     behavior: "smooth",
    //     block: "center",
    //   });
    //   return;
    // }

    // if (tripStartTime === tripTime || tripStartTime > tripTime) {
    //   setErrors({ tripTime: "ES_FSTP_INVALID_TRIP_TIME" });
    //   tripTimeRef.current.scrollIntoView({
    //     behavior: "smooth",
    //     block: "center",
    //   });
    //   return;
    // }

    setErrors({});

    let temp = {};
    const d = new Date();
    const timeStamp =
      Date.parse(new Date(d.toString().split(":")[0].slice(0, -2) + tripTime)) /
      1000;
    // const tripStartTimestamp =
    //   Date.parse(
    //     new Date(d.toString().split(":")[0].slice(0, -2) + tripStartTime)
    //   ) / 1000;
    const tripDetail = { tripNo: 1 };
    temp.tenantId = tenantId;
    temp.status = "ACTIVE";
    // temp.tripStartTime = tripStartTimestamp;
    temp.tripEndTime = timeStamp;
    temp.volumeCarried = wasteCollected;
    temp.additionalDetails = {
      vehicleNumber: newVehicleNumber || applicationNos,
      dsoName: newDsoName,
      locality: newLocality,
      fileStoreId: uploadedFile,
      comments: comments,
      gramPanchayat: selectedGp,
      village: selectedVillage,
      newGramPanchayat: newGramPanchayat,
      newVillage: newVillage,
      boundaryType:
        selectLocation.code === "FROM_GRAM_PANCHAYAT"
          ? selectedVillage?.code
            ? "Village"
            : "GP"
          : "Locality",
    };
    temp.businessService = "FSM_VEHICLE_TRIP";
    temp.tripDetails = [
      {
        tenantId: tenantId,
        status: "ACTIVE",
      },
    ];

    const details = {
      vehicleTrip: [temp],
    };

    create_mutation.mutate(details, {
      onSuccess: handleSuccess,
      onError: handleError,
    });
  };

  const handleDecline = (data) => {
    vehicle.additionalDetails = {
      comments: data?.workflow?.comments,
      vehicleDeclineReason: data?.workflow?.fstpoRejectionReason,
    };
    const details = {
      vehicleTrip: [vehicle],
      workflow: {
        action: "DECLINEVEHICLE",
      },
    };

    mutation.mutate(details, {
      onSuccess: handleSuccess,
      onError: handleError,
    });
  };

  const closeToast = () => {
    setShowToast(null);
  };

  const handleSuccess = () => {
    if (selectedAction === "DECLINEVEHICLE") {
      setShowModal(false);
    }
    /* Show Toast on success */
    queryClient.invalidateQueries("FSM_VEHICLE_DATA");
    setShowToast({ key: "success", action: `ES_FSM_DISPOSE_UPDATE_SUCCESS` });
    setTimeout(() => {
      closeToast();
      history.push(`/digit-ui/employee`);
    }, 5000);
  };

  const handleError = () => {
    if (selectedAction === "DECLINEVEHICLE") {
      setShowModal(false);
      setSelectedAction(null);
    }
    /* Show Toast on error */
    queryClient.invalidateQueries("FSM_VEHICLE_DATA");
    setShowToast({ key: "error", action: `ES_FSM_DISPOSE_UPDATE_FAILURE` });
    setTimeout(() => {
      closeToast();
    }, 5000);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    // if (name === "tripTime") {
    // setTripTime(value);
    // } else
    if (name === "wasteRecieved") {
      setWasteCollected(value);
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  const vehicleData = [
    {
      title: `${t("ES_INBOX_VEHICLE_NO")} *`,
      value: vehicle?.vehicle?.registrationNumber || applicationNos || (
        <TextInput
          onChange={(e) => onChangeVehicleNumber(e.target.value)}
          value={newVehicleNumber}
        />
      ),
      labelChildren: (
        <div
          className="tooltip"
          style={{ paddingLeft: "10px", marginBottom: "-3px" }}
        >
          <InfoIcon />
          <span
            className="tooltiptext"
            style={{
              width: "150px",
              left: "230%",
              fontSize: "14px",
              height: "fit-content",
              top: "20px",
              display: "flex",
            }}
          >
            {t("ES_FSM_VEHICLE_FORMAT_TIP")}
          </span>
        </div>
      ),
    },
    {
      title: `${t("ES_INBOX_DSO_NAME")} *`,
      value: vehicle?.tripOwner?.name || (
        <TextInput
          //style={{ width: "40%" }}
          onChange={(e) => onChangeDsoName(e.target.value)}
          value={newDsoName}
        />
      ),
    },
    {
      title: `${t("ES_INBOX_LOCALITY")} *`,
      value: (tripDetails && tripDetails[0]?.address?.locality?.name) || (
        <TextInput
          //style={{ width: "40%" }}
          onChange={(e) => onChangeLocality(e.target.value)}
          value={newLocality}
        />
      ),
    },
  ];

  const handleTimeChange = (value, cb) => {
    if (typeof value === "string") {
      cb(value);
    }
  };

  function onActionSelect(action) {
    setSelectedAction(action);
    setDisplayMenu(false);
  }

  const closeModal = () => {
    setSelectedAction(null);
    setShowModal(false);
  };

  function selectfile(e) {
    if (e) {
      let temp = [...uploadedFile, e?.fileStoreId?.fileStoreId];
      setUploadedFile(temp);
      e && setFile(e.file);
    }
  }

  const getData = (state) => {
    let data = Object.fromEntries(state);
    let newArr = Object.values(data);
    selectfile(newArr[newArr.length - 1]);
  };

  function selectedValue(value) {
    setSelectLocation(value);
  }

  function selectGramPanchayat(value) {
    setSelectedGp(value);
    if (value.code !== "OTHER") {
      const filteredVillages = gramPanchayats.filter(
        (items) => items.code === value.code
      )[0]?.children;
      var localitiesWithLocalizationKeys = filteredVillages.map((obj) => ({
        ...obj,
        i18nkey: tenantId.replace(".", "_").toUpperCase() + "_" + obj.code,
      }));
      if (localitiesWithLocalizationKeys.length > 0) {
        localitiesWithLocalizationKeys.push({
          code: "OTHER",
          name: "Other",
          i18nkey: tenantId.replace(".", "_").toUpperCase() + "_OTHER",
        });
        setVillages(localitiesWithLocalizationKeys);
      }
    }
  }

  function selectVillage(value) {
    setSelectedVillage(value);
  }

  const onChangeGramPanchayat = (value) => {
    setNewGramPanchayat(value);
  };

  const onChangeVillage = (value) => {
    setNewVillage(value);
  };

  return (
    <div>
      <Header styles={{ marginLeft: "16px" }}>
        {t("ES_INBOX_VEHICLE_LOG")}
      </Header>
      <Card>
        <StatusTable>
          {vehicleData?.map((row, index) => (
            <Row
              rowContainerStyle={
                isMobile &&
                history.location.pathname.includes("new-vehicle-entry")
                  ? { display: "block" }
                  : { justifyContent: "space-between" }
              }
              textStyle={
                isMobile &&
                history.location.pathname.includes("new-vehicle-entry")
                  ? { width: "100%" }
                  : {}
              }
              key={row.title}
              label={row.title}
              text={row.value || "N/A"}
              last={false}
              labelStyle={
                isMobile &&
                history.location.pathname.includes("new-vehicle-entry")
                  ? { fontWeight: "normal", display: "contents" }
                  : { fontWeight: "normal" }
              }
              labelChildren={
                history.location.pathname.includes("new-vehicle-entry")
                  ? row.labelChildren
                  : ""
              }
            />
          ))}
          {isNew && isUrcEnable && (
            <div
              style={
                !isMobile &&
                history.location.pathname.includes("new-vehicle-entry")
                  ? {
                      display: "flex",
                      justifyContent: "space-between",
                      paddingBottom: "8px",
                      marginBottom: "8px",
                    }
                  : {}
              }
            >
              <CardLabel>{`${t("CS_PROPERTY_LOCATION")} *`}</CardLabel>
              <div
                style={
                  !isMobile &&
                  history.location.pathname.includes("new-vehicle-entry")
                    ? { width: "50%" }
                    : {}
                }
              >
                <RadioButtons
                  selectedOption={selectLocation}
                  onSelect={selectedValue}
                  style={
                    !isMobile &&
                    history.location.pathname.includes("new-vehicle-entry")
                      ? { display: "flex", marginBottom: 0 }
                      : {}
                  }
                  innerStyles={{ marginLeft: "10px" }}
                  options={inputs}
                  optionsKey="i18nKey"
                  // disabled={editScreen}
                />
              </div>
            </div>
          )}
          {selectLocation.code === "FROM_GRAM_PANCHAYAT" ? (
            <div>
              <Row
                rowContainerStyle={
                  isMobile &&
                  history.location.pathname.includes("new-vehicle-entry")
                    ? { display: "block" }
                    : { justifyContent: "space-between" }
                }
                textStyle={
                  isMobile &&
                  history.location.pathname.includes("new-vehicle-entry")
                    ? { width: "100%" }
                    : {}
                }
                key={t("CS_GRAM_PANCHAYAT")}
                label={`${t("CS_GRAM_PANCHAYAT")} * `}
                text={
                  tripDetails && tripDetails.length > 0 ? (
                    tripDetails[0]?.address?.gramPanchayat?.name
                  ) : (
                    <Dropdown
                      className="form-field"
                      isMandatory
                      selected={selectedGp}
                      option={gramPanchayats}
                      select={selectGramPanchayat}
                      optionKey="i18nkey"
                      style={{ width: "100%" }}
                      t={t}
                    />
                  )
                }
                last={false}
                labelStyle={{ fontWeight: "normal" }}
              />
              {selectedGp?.code === "OTHER" && (
                <div>
                  <Row
                    rowContainerStyle={
                      isMobile &&
                      history.location.pathname.includes("new-vehicle-entry")
                        ? { display: "block" }
                        : { justifyContent: "space-between" }
                    }
                    textStyle={
                      isMobile &&
                      history.location.pathname.includes("new-vehicle-entry")
                        ? { width: "100%" }
                        : {}
                    }
                    key={t("ES_INBOX_PLEASE_SPECIFY_GRAM_PANCHAYAT")}
                    label={`${t("ES_INBOX_PLEASE_SPECIFY_GRAM_PANCHAYAT")} * `}
                    text={
                      tripDetails && tripDetails.length > 0 ? (
                        tripDetails[0]?.address?.locality?.name
                      ) : (
                        <TextInput
                          onChange={(e) =>
                            onChangeGramPanchayat(e.target.value)
                          }
                          value={newGramPanchayat}
                        />
                      )
                    }
                    last={false}
                    labelStyle={{ fontWeight: "normal" }}
                  />
                  <Row
                    rowContainerStyle={
                      isMobile &&
                      history.location.pathname.includes("new-vehicle-entry")
                        ? { display: "block" }
                        : { justifyContent: "space-between" }
                    }
                    textStyle={
                      isMobile &&
                      history.location.pathname.includes("new-vehicle-entry")
                        ? { width: "100%" }
                        : {}
                    }
                    key={t("ES_INBOX_PLEASE_SPECIFY_VILLAGE")}
                    label={`${t("ES_INBOX_PLEASE_SPECIFY_VILLAGE")}`}
                    text={
                      tripDetails && tripDetails.length > 0 ? (
                        tripDetails[0]?.address?.locality?.name
                      ) : (
                        <TextInput
                          onChange={(e) => onChangeVillage(e.target.value)}
                          value={newVillage}
                        />
                      )
                    }
                    last={false}
                    labelStyle={{ fontWeight: "normal" }}
                  />
                </div>
              )}
              {/* {selectedGp?.code !== "OTHER" && (
                <Row
                  rowContainerStyle={
                    isMobile &&
                    history.location.pathname.includes("new-vehicle-entry")
                      ? { display: "block" }
                      : { justifyContent: "space-between" }
                  }
                  textStyle={
                    isMobile &&
                    history.location.pathname.includes("new-vehicle-entry")
                      ? { width: "100%" }
                      : {}
                  }
                  key={t("CS_VILLAGE_NAME")}
                  label={`${t("CS_VILLAGE_NAME")}`}
                  text={
                    tripDetails && tripDetails.length > 0 ? (
                      tripDetails[0]?.address?.village?.name
                    ) : (
                      <Dropdown
                        className="form-field"
                        isMandatory
                        selected={selectedVillage}
                        option={villages}
                        select={selectVillage}
                        optionKey="i18nkey"
                        style={{ width: "100%" }}
                        t={t}
                      />
                    )
                  }
                  last={false}
                  labelStyle={{ fontWeight: "normal" }}
                />
              )} */}
              {selectedVillage?.code === "OTHER" && (
                <Row
                  rowContainerStyle={
                    isMobile &&
                    history.location.pathname.includes("new-vehicle-entry")
                      ? { display: "block" }
                      : { justifyContent: "space-between" }
                  }
                  textStyle={
                    isMobile &&
                    history.location.pathname.includes("new-vehicle-entry")
                      ? { width: "100%" }
                      : {}
                  }
                  key={t("ES_INBOX_PLEASE_SPECIFY_VILLAGE")}
                  label={`${t("ES_INBOX_PLEASE_SPECIFY_VILLAGE")} * `}
                  text={
                    tripDetails && tripDetails.length > 0 ? (
                      tripDetails[0]?.address?.locality?.name
                    ) : (
                      <TextInput
                        onChange={(e) => onChangeVillage(e.target.value)}
                        value={newVillage}
                      />
                    )
                  }
                  last={false}
                  labelStyle={{ fontWeight: "normal" }}
                />
              )}
            </div>
          ) : (
            <Row
              rowContainerStyle={
                isMobile &&
                history.location.pathname.includes("new-vehicle-entry")
                  ? { display: "block" }
                  : { justifyContent: "space-between" }
              }
              textStyle={
                isMobile &&
                history.location.pathname.includes("new-vehicle-entry")
                  ? { width: "100%" }
                  : {}
              }
              key={t("ES_INBOX_LOCALITY")}
              label={`${t("ES_INBOX_LOCALITY")} * `}
              text={
                tripDetails && tripDetails.length > 0 ? (
                  tripDetails[0]?.address?.locality?.name
                ) : (
                  <TextInput
                    onChange={(e) => onChangeLocality(e.target.value)}
                    value={newLocality}
                  />
                )
              }
              last={false}
              labelStyle={{ fontWeight: "normal" }}
            />
          )}
          {/* <div ref={tripStartTimeRef}>
            <CardLabelError>{t(errors.tripStartTime)}</CardLabelError>
          </div> */}
          <form>
            {/* <Row
              key={t("ES_VEHICLE_IN_TIME")}
              label={`${t("ES_VEHICLE_IN_TIME")} * `}
              labelStyle={{ minWidth: "fit-content", fontWeight: "normal" }}
              textStyle={isMobile ? { width: "100%" } : {}}
              rowContainerStyle={
                isMobile
                  ? { display: "block" }
                  : { justifyContent: "space-between" }
              }
              text={
                <div>
                  <CustomTimePicker
                    name="tripStartTime"
                    onChange={(val) => handleTimeChange(val, setTripStartTime)}
                    value={tripStartTime}
                  />
                </div>
              }
            /> */}
            <div ref={wasteRecievedRef}>
              <CardLabelError>{t(errors.wasteRecieved)}</CardLabelError>
            </div>
            <Row
              key={t("ES_VEHICLE_SEPTAGE_DUMPED")}
              label={`${t("ES_VEHICLE_SEPTAGE_DUMPED")} * `}
              labelStyle={{ minWidth: "fit-content", fontWeight: "normal" }}
              textStyle={isMobile ? { width: "100%" } : {}}
              text={
                <div>
                  <TextInput
                    type="number"
                    name="wasteRecieved"
                    value={wasteCollected}
                    onChange={handleChange}
                  />
                </div>
              }
              rowContainerStyle={
                isMobile
                  ? { display: "block" }
                  : { justifyContent: "space-between" }
              }
            />
            {/* <div ref={tripTimeRef}>
              <CardLabelError>{t(errors.tripTime)}</CardLabelError>
            </div> */}
            {/* <Row
              key={t("ES_VEHICLE_OUT_TIME")}
              label={`${t("ES_VEHICLE_OUT_TIME")} * `}
              labelStyle={{ minWidth: "fit-content", fontWeight: "normal" }}
              textStyle={isMobile ? { width: "100%" } : {}}
              rowContainerStyle={
                isMobile
                  ? { display: "block" }
                  : { justifyContent: "space-between" }
              }
              text={
                <div>
                  <CustomTimePicker
                    name="tripTime"
                    onChange={(val) => handleTimeChange(val, setTripTime)}
                    value={tripTime}
                  />
                </div>
              }
            /> */}
            {/* {!isSearchLoading && !isIdle && tripDetails && currentTrip ?
              <Row
                key={t("ES_VEHICLE_TRIP_NO")}
                label={`${t("ES_VEHICLE_TRIP_NO")} * `}
                rowContainerStyle={isMobile ? { display: "block" } : { justifyContent: "space-between" }}
                textStyle={isMobile ? { width: "100%" } : {}}
                labelStyle={{ fontWeight: "normal" }}
                text={
                  <div>
                    <Dropdown
                      disable
                      selected={{ "name": `${currentTrip} of ${tripDetails[0]?.noOfTrips ? tripDetails[0]?.noOfTrips : 1}` }}
                      t={t}
                      optionKey="name"
                      style={{ width: '100%' }} />
                  </div>
                }
              >
              </Row> : null} */}
            <div
              className={!isMobile && "row"}
              style={
                isMobile
                  ? {}
                  : {
                      diplay: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }
              }
            >
              <CardLabel style={{ fontWeight: "normal" }}>
                {" "}
                {t("ES_FSM_ADDITIONAL_DETAILS")}{" "}
              </CardLabel>
              <TextArea
                className="form-field"
                onChange={(e) => {
                  if (e.target.value.length > 1024) {
                    null;
                  } else {
                    setComments(e.target.value);
                  }
                }}
                style={
                  isMobile
                    ? { width: "100%" }
                    : { width: "63%", marginLeft: "30%" }
                }
              />
            </div>

            <Row
              key={t("ES_FSM_ATTACHMENTS")}
              label={`${t("ES_FSM_ATTACHMENT")}`}
              labelStyle={{ minWidth: "fit-content", fontWeight: "normal" }}
              textStyle={isMobile ? { width: "100%" } : {}}
              rowContainerStyle={
                isMobile
                  ? { display: "block" }
                  : { justifyContent: "space-between", alignItems: "center" }
              }
              text={
                <MultiUploadWrapper
                  t={t}
                  module="fsm"
                  tenantId={stateId}
                  getFormState={(e) => getData(e)}
                />
              }
            />

            {!workflowDetails?.isLoading &&
              workflowDetails?.data?.nextActions?.length > 0 &&
              (workflowDetails?.data?.nextActions?.length === 1 ? (
                <ActionBar>
                  <SubmitBar
                    label={t(
                      `CS_ACTION_${workflowDetails?.data?.nextActions?.[0]?.action}`
                    )}
                    onSubmit={() =>
                      onActionSelect(
                        workflowDetails?.data?.nextActions?.[0]?.action
                      )
                    }
                  />
                </ActionBar>
              ) : (
                <ActionBar>
                  {displayMenu && workflowDetails?.data?.nextActions ? (
                    <Menu
                      localeKeyPrefix={""}
                      options={workflowDetails?.data?.nextActions.map(
                        (action) => action.action
                      )}
                      t={t}
                      onSelect={onActionSelect}
                    />
                  ) : null}
                  <SubmitBar
                    label={t("ES_COMMON_TAKE_ACTION")}
                    onSubmit={() => setDisplayMenu(!displayMenu)}
                  />
                </ActionBar>
              ))}
          </form>
          {showModal ? (
            <ActionModal
              t={t}
              action={selectedAction}
              tenantId={tenantId}
              state={state}
              id={applicationNos}
              closeModal={closeModal}
              submitAction={handleDecline}
              actionData={workflowDetails?.data?.timeline}
            />
          ) : null}
          {/* <LabelFieldPair>
            <CardLabel>{t("ES_VEHICLE_WASTE_RECIEVED")}</CardLabel>
            <div className="field-container">
              <TextInput name="wasteRecieved" value={wasteCollected} onChange={handleChange} />
            </div>
            {errors.wasteRecieved && <CardLabelError>{t(errors.wasteRecieved)}</CardLabelError>}
          </LabelFieldPair>
          <LabelFieldPair>
            <CardLabel>{t("ES_COMMON_TIME")}</CardLabel>
            <div>
              <TimePicker
                className="time-picker"
                name="tripTime"
                onChange={setTripTime}
                value={tripTime}
                locale="en-US"
                format="hh:mm a"
                clearIcon={null}
              />
            </div>
          </LabelFieldPair> */}
        </StatusTable>
      </Card>
      {/* <h2 style={{ fontWeight: "bold", fontSize: "16px", marginLeft: "8px", marginTop: "16px" }}>{t("ES_FSTP_OPERATOR_DETAILS_WASTE_GENERATORS")}</h2>
      {isSearchLoading || isIdle ? (
        <Loader />
      ) : (
        <Card>
          <StatusTable>
            {tripDetails?.map((trip, index) => {
              return (
                <>
                  <Row key={index} label={t("CS_FILE_DESLUDGING_APPLICATION_NO")} text={trip.applicationNo} />
                  <Row
                    rowContainerStyle={{ justifyContent: "space-between" }}
                    key={index}
                    label={t("ES_INBOX_LOCALITY")}
                    text={t(`${trip?.tenantId?.toUpperCase()?.split(".")?.join("_")}_REVENUE_${trip?.address?.locality?.code}`)}
                  />
                  <Row key={index} label={t("ES_USAGE")} text={t(`PROPERTYTYPE_MASTERS_${trip.propertyUsage}`)} />
                  <Row key={index} label={t("ES_WASTE_RECIEVED")} text={vehicle.tripDetails[index].volume} />
                </>
              );
            })}
          </StatusTable>
        </Card>
      )} */}
      {showToast && (
        <Toast
          error={showToast.key === "error" ? true : false}
          label={t(
            showToast.key === "success" ? showToast.action : showToast.action
          )}
          onClose={closeToast}
        />
      )}
    </div>
  );
};

export default FstpOperatorDetails;

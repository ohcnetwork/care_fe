import { PatientEncounter } from "@/pageObject/Patients/PatientEncounter";
import { PatientFiles } from "@/pageObject/Patients/PatientFiles";
import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";

const facilityCreation = new FacilityCreation();
const patientEncounter = new PatientEncounter();
const patientFiles = new PatientFiles();

describe("Patient Files", () => {
  beforeEach(() => {
    cy.loginByApi("raj");
    cy.visit("/");
    facilityCreation.selectFacility("MEDICAL FACILITY");

    patientEncounter
      .navigateToEncounters()
      .openFirstEncounterDetails()
      .clickPatientDetailsButton();
    patientFiles.clickFilesTab();
  });

  const timestamp = new Date().getTime();
  const validationMessage = "Please give a name for the file";
  const fileUploadSuccessToast = "File Uploaded Successfully";
  const newFileName = "Renamed Cypress File1 " + timestamp;
  const newFileDisplayName = newFileName + ".png";
  const archiveReason = "Cypress Archive Reason";

  // Single File Upload Setup
  const fileName = "sample_img1.png";
  const filePath = (fileName: string) => `cypress/fixtures/${fileName}`;

  // Multiple Files Upload Setup
  const fileNames = ["sample_img1.png", "sample_img2.png", "sample_file.xlsx"];
  const inputFileNames = [
    "Cypress Image Test 1 " + timestamp,
    "Cypress Image Test 2 " + timestamp,
    "Cypress File Test 3 " + timestamp,
  ];
  const fileDisplayNames = [
    inputFileNames[0] + ".png",
    inputFileNames[1] + ".png",
    inputFileNames[2] + ".xlsx",
  ];

  it("Add a new patient file", () => {
    const inputFileName1 = "Cypress Test File Upload 1 " + timestamp;
    const fileDisplayName1 = inputFileName1 + ".png";

    patientFiles
      .clickAddFilesButton()
      .uploadSingleFile(filePath(fileName))
      .clickUploadFilesButton()
      .verifyValidationErrors(validationMessage)
      .fillSingleFileName(inputFileName1)
      .interceptFileUploadRequest()
      .clickUploadFilesButton()
      .verifyFileUploadApiCall()
      .verifySingleFileUploadSuccess(fileUploadSuccessToast)
      .verifyFilesAdded([fileDisplayName1]);
  });

  it("Add multiple patient files", () => {
    const filePaths = (fileNames: string[]) =>
      fileNames.map((file) => `cypress/fixtures/${file}`);

    patientFiles
      .clickAddFilesButton()
      .uploadMultipleFiles(filePaths(fileNames))
      .clickUploadFilesButton()
      .verifyValidationErrors(validationMessage)
      .fillMultipleFileNames(inputFileNames)
      .interceptFileUploadRequest()
      .clickUploadFilesButton()
      .verifyFileUploadApiCall()
      .verifyMultipleFileUploadSuccess(fileUploadSuccessToast)
      .verifyFilesAdded(fileDisplayNames);
  });

  it("Record, Upload and Download Audio file", () => {
    // Audio File Upload Setup
    const audioFileName = "Cypress Audio Test " + timestamp;
    const audioDisplayName = audioFileName + ".mp3";
    const fileDownloadingSuccessToast = "Downloading file...";

    patientFiles
      .clickAddFilesButton()
      .clickRecordAudioButton()
      .startRecordingAudio()
      .stopRecordingAudio()

      // Test Cancel Audio Button
      .clickCancelAudioButton()
      .clickFilesTab()
      .clickAddFilesButton()

      // Test Start Again Button
      .clickRecordAudioButton()
      .startRecordingAudio()
      .stopRecordingAudio()
      .clickStartAgainButton()

      // Record and Upload Audio File
      .stopRecordingAudio()
      .clickSaveAudioButton()
      .clickUploadFilesButton()
      .verifyValidationErrors(validationMessage)
      .fillSingleFileName(audioFileName)
      .interceptFileUploadRequest()
      .clickUploadFilesButton()
      .verifyFileUploadApiCall()
      .verifySingleFileUploadSuccess(fileUploadSuccessToast)
      .verifyFilesAdded([audioDisplayName])

      // Download Audio file
      .clickFileDetailsButton(audioDisplayName)
      .clickDownloadFile()
      .verifySingleFileUploadSuccess(fileDownloadingSuccessToast);
  });

  it("File Modification, Rename and Archive", () => {
    const fileArchiveSuccessToast = "File archived successfully";
    const fileRenameSuccessToast = "File name changed successfully";
    const inputFileName2 = "Cypress Test File Upload 2 " + timestamp;
    const fileDisplayName2 = inputFileName2 + ".png";

    // Upload a new file
    patientFiles
      .clickAddFilesButton()
      .uploadSingleFile(filePath(fileName))
      .clickUploadFilesButton()
      .verifyValidationErrors(validationMessage)
      .fillSingleFileName(inputFileName2)
      .interceptFileUploadRequest()
      .clickUploadFilesButton()
      .verifyFileUploadApiCall()
      .verifySingleFileUploadSuccess(fileUploadSuccessToast)
      .verifyFilesAdded([fileDisplayName2])

      // Rename the file
      .clickFileDetailsButton(fileDisplayName2)
      .clickRenameOption()
      .fillNewFileName(newFileName)
      .interceptFileRenameRequest()
      .clickProceedButton()
      .verifyFileRenameApiCall()
      .verifySingleFileUploadSuccess(fileRenameSuccessToast)
      .verifyFilesAdded([newFileDisplayName])

      // Archive the file
      .clickFileDetailsButton(newFileDisplayName)
      .clickArchiveOption()
      .fillArchiveReason(archiveReason)
      .interceptFileArchiveRequest()
      .clickProceedButton()
      .verifyFileArchiveApiCall()
      .verifySingleFileUploadSuccess(fileArchiveSuccessToast)
      .verifyNotAccessible(newFileDisplayName, archiveReason);
  });

  it("File Accessible by another user", () => {
    cy.loginByApi("raj");
    cy.visit("/");
    facilityCreation.selectFacility("MEDICAL FACILITY");

    patientEncounter
      .navigateToEncounters()
      .openFirstEncounterDetails()
      .clickPatientDetailsButton();

    patientFiles
      .clickFilesTab()

      // Verify active file is accessible to other user
      .clickViewFile(fileDisplayNames[1])
      .closeFilePreview()
      .clickViewFile(fileDisplayNames[0])
      .closeFilePreview()

      // Verify archived file is not accessible to other user
      .filterArchivedFiles()
      .verifyNotAccessible(newFileDisplayName, archiveReason)
      .removeFilter();
  });

  it("Capture image and upload", () => {
    // Capture Image Upload Setup
    const captureFileName = "Cypress Capture Test " + timestamp;
    const captureDisplayName = captureFileName + ".png";

    patientFiles
      .clickAddFilesButton()
      .openCamera()
      .captureImage()
      .retakeCapture()
      .captureImage()
      .clickSubmit()
      .clickUploadFilesButton()
      .verifyValidationErrors(validationMessage)
      .fillSingleFileName(captureFileName)
      .interceptFileUploadRequest()
      .clickUploadFilesButton()
      .verifyFileUploadApiCall()
      .verifySingleFileUploadSuccess(fileUploadSuccessToast)
      .verifyFilesAdded([captureDisplayName]);
  });
});

import { PatientEncounter } from "@/pageObject/Patients/PatientEncounter";
import { PatientFiles } from "@/pageObject/Patients/PatientFiles";
import { UserProfile } from "@/pageObject/Users/UserProfile";
import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";

const facilityCreation = new FacilityCreation();
const patientEncounter = new PatientEncounter();
const patientFiles = new PatientFiles();
const userProfile = new UserProfile();

describe("Patient Files", () => {
  beforeEach(() => {
    cy.loginByApi("devnurse1");
    cy.visit("/");
    facilityCreation.selectFacility("GHC Payyanur");

    patientEncounter
      .navigateToEncounters()
      .clickInProgressEncounterFilter()
      .searchEncounter("Jane")
      .openFirstEncounterDetails()
      .clickPatientDetailsButton();
    patientFiles.clickFilesTab();
  });

  const timestamp = new Date().getTime();
  const validationMessage = "Please give a name for the file";
  const fileUploadSuccessToast = "File Uploaded Successfully";
  const newFileName = "Renamed Cypress File1 " + timestamp;
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

  const inputFileName1 = "Cypress Test File Upload 1 " + timestamp;

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
      .verifyFileUploadApiCall();
  });

  it("Capture image and upload", () => {
    // Capture Image Upload Setup
    const captureFileName = "Cypress Capture Test " + timestamp;

    patientFiles
      .clickAddFilesButton()
      .openCamera()
      .captureImage()
      .clickSubmit()
      .clickUploadFilesButton()
      .verifyValidationErrors(validationMessage)
      .fillSingleFileName(captureFileName)
      .interceptFileUploadRequest()
      .clickUploadFilesButton()
      .verifyFileUploadApiCall()
      .verifySingleFileUploadSuccess(fileUploadSuccessToast);
  });

  it("File Uploaded by one user is accessible to another user", () => {
    patientFiles
      .clickAddFilesButton()
      .selectUploadFromDevice()
      .uploadSingleFile(filePath(fileName))
      .fillSingleFileName(inputFileName1)
      .interceptFileUploadRequest()
      .clickUploadFilesButton()
      .verifyFileUploadApiCall()
      .verifySingleFileUploadSuccess(fileUploadSuccessToast)
      .filterActiveFiles()
      .clickFirstFileViewButton()
      .closeFilePreview()
      .saveCurrentUrl();

    userProfile.openUserMenu().clickUserLogout();
    cy.loginByApi("devnurse2");
    patientFiles
      .navigateToSavedUrl()
      .clickFirstFileViewButton()
      .clickDownloadFile();
  });

  it("Add a new patient single file upload , Rename and Archive it", () => {
    const fileArchiveSuccessToast = "File archived successfully";
    const fileRenameSuccessToast = "File name changed successfully";

    // Upload a single file
    patientFiles
      .clickAddFilesButton()
      .selectUploadFromDevice()
      .uploadSingleFile(filePath(fileName))
      .clickUploadFilesButton()
      .verifyValidationErrors(validationMessage)
      .fillSingleFileName(inputFileName1)
      .interceptFileUploadRequest()
      .clickUploadFilesButton()
      .verifyFileUploadApiCall()
      .verifySingleFileUploadSuccess(fileUploadSuccessToast);

    // Filter the file to only show the active files and rename the file
    patientFiles
      .filterActiveFiles()
      .clickFileDetailsButton()
      .clickRenameOption()
      .fillNewFileName(newFileName)
      .interceptFileRenameRequest()
      .clickProceedButton()
      .verifyFileRenameApiCall()
      .verifySingleFileUploadSuccess(fileRenameSuccessToast);

    // Archive the file
    patientFiles
      .clickFileDetailsButton()
      .clickArchiveOption()
      .fillArchiveReason(archiveReason)
      .interceptFileArchiveRequest()
      .clickProceedButton()
      .verifyFileArchiveApiCall()
      .verifySingleFileUploadSuccess(fileArchiveSuccessToast);
  });

  it("Record, Upload and Download Audio file", () => {
    // Audio File Upload Setup
    const audioFileName = "Cypress Audio Test " + timestamp;

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
      .verifySingleFileUploadSuccess(fileUploadSuccessToast);
  });
});

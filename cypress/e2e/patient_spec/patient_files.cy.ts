import { PatientEncounter } from "@/pageObject/Patients/PatientEncounter";
import { PatientFiles } from "@/pageObject/Patients/PatientFiles";
import { UserProfile } from "@/pageObject/Users/UserProfile";
import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";
import { generateName } from "@/utils/commonUtils";
import { viewPort } from "@/utils/viewPort";

const facilityCreation = new FacilityCreation();
const patientEncounter = new PatientEncounter();
const patientFiles = new PatientFiles();
const userProfile = new UserProfile();

describe("Patient Files", () => {
  beforeEach(() => {
    cy.viewport(viewPort.laptopStandard.width, viewPort.laptopStandard.height);
    cy.loginByApi("devnurse1");
    cy.visit("/");
    facilityCreation.selectFacility("GHC Payyanur");
    const patientName = generateName(true);

    patientEncounter
      .navigateToEncounters()
      .searchEncounter(patientName)
      .clickInProgressEncounterFilter()
      .openFirstEncounterDetails()
      .clickPatientDetailsButton();
    patientFiles.clickFilesTab();
  });

  const timestamp = Date.now().toString().slice(-6);
  const validationMessage = "Please give a name for the file";
  const fileUploadSuccessToast = "File Uploaded Successfully";
  const newFileName = `File1-${timestamp}`;
  const archiveReason = "Cypress Archive Reason";

  // Single File Upload Setup
  const fileName = "sample_img1.png";
  const filePath = (fileName: string) => `cypress/fixtures/${fileName}`;

  // Multiple Files Upload Setup
  const fileNames = ["sample_img1.png", "sample_img2.png", "sample_file.xlsx"];
  const inputFileNames = [
    `Img1-${timestamp}`,
    `Img2-${timestamp}`,
    `File3-${timestamp}`,
  ];

  const inputFileName1 = `Upload1-${timestamp}`;

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

  it("File Uploaded by one user is accessible to another user", () => {
    patientFiles
      .filterActiveFiles()
      .clickAddFilesButton()
      .selectUploadFromDevice()
      .uploadSingleFile(filePath(fileName))
      .fillSingleFileName(inputFileName1)
      .interceptFileUploadRequest()
      .clickUploadFilesButton()
      .verifyFileUploadApiCall()
      .verifySingleFileUploadSuccess(fileUploadSuccessToast)
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

  it("Add a new patient file and rename it", () => {
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

    // Rename the file
    patientFiles
      .filterActiveFiles()
      .clickFileDetailsButton()
      .clickRenameOption()
      .fillNewFileName(newFileName)
      .interceptFileRenameRequest()
      .clickProceedButton()
      .verifyFileRenameApiCall()
      .verifySingleFileUploadSuccess(fileRenameSuccessToast);
  });

  it("Add a new patient file and archive it", () => {
    const fileArchiveSuccessToast = "File archived successfully";

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

    // Archive the file
    patientFiles
      .filterActiveFiles()
      .clickFileDetailsButton()
      .clickArchiveOption()
      .fillArchiveReason(archiveReason)
      .interceptFileArchiveRequest()
      .clickProceedButton()
      .verifyFileArchiveApiCall()
      .verifySingleFileUploadSuccess(fileArchiveSuccessToast);
  });

  it("Record and upload audio file", () => {
    // Audio File Upload Setup
    const audioFileName = `Audio-${timestamp}`;

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

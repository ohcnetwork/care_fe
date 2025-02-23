import { PatientEncounter } from "@/pageObject/Patients/PatientEncounter";
import { PatientFiles } from "@/pageObject/Patients/PatientFiles";
import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";

const facilityCreation = new FacilityCreation();
const patientEncounter = new PatientEncounter();
const patientFiles = new PatientFiles();

describe("Patient Files", () => {
  beforeEach(() => {
    cy.loginByApi("nurse");
    cy.visit("/");
    facilityCreation.selectFacility("PHC Angamaly");
    patientEncounter
      .navigateToEncounters()
      .openFirstEncounterDetails()
      .clickPatientDetailsButton();
    patientFiles.clickFilesTab();
  });

  const validationMessage = "Please give a name for the file";
  const fileUploadSuccessToast = "File Uploaded Successfully";
  const fileArchiveSuccessToast = "File archived successfully";
  const fileRenameSuccessToast = "File name changed successfully";
  const fileDownloadingSuccessToast = "Downloading file...";
  const newFileName = "Renamed Cypress File1";
  const newFileDisplayName = "Renamed Cypress File1.png";
  const archiveReason = "Cypress Archive Reason";

  // Audio File Upload Setup

  const audioFileName = "Cypress Audio Test";
  const audioDisplayName = audioFileName + ".mp3";

  // Single File Upload Setup

  const fileName = "sample_img1.png";
  const inputFileName = "Cypress Test File Upload";
  const fileDisplayName = inputFileName + ".png";
  const filePath = (fileName: string) => `cypress/fixtures/${fileName}`;

  // Multiple Files Upload Setup

  const fileNames = ["sample_img1.png", "sample_img2.png", "sample_file.xlsx"];
  const inputFileNames = [
    "Cypress Image Test 1",
    "Cypress Image Test 2",
    "Cypress File Test 3",
  ];
  const fileDisplayNames = [
    "Cypress Image Test 1.png",
    "Cypress Image Test 2.png",
    "Cypress File Test 3.xlsx",
  ];
  const filePaths = (fileNames: string[]) =>
    fileNames.map((file) => `cypress/fixtures/${file}`);

  it("Add a new patient file", () => {
    patientFiles
      .clickAddFilesButton()
      .uploadSingleFile(filePath(fileName))
      .clickUploadFilesButton()
      .verifyValidationErrors(validationMessage)
      .fillSingleFileName(inputFileName)
      .interceptFileUploadRequest()
      .clickUploadFilesButton()
      .verifyFileUploadApiCall()
      .verifySingleFileUploadSuccess(fileUploadSuccessToast)
      .verifyFilesAdded([fileDisplayName]);
  });

  it("Add multiple patient files", () => {
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

  it("Record an Audio and download", () => {
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
      .filterActiveFiles()
      .verifyFilesAdded([audioDisplayName])

      // Download Audio file

      .clickFileDetailsButton(audioDisplayName)
      .clickDownloadFile()
      .verifySingleFileUploadSuccess(fileDownloadingSuccessToast);
  });

  it("File Modification, Rename and Archive", () => {
    // Upload a new file

    patientFiles
      .clickAddFilesButton()
      .uploadSingleFile(filePath(fileName))
      .clickUploadFilesButton()
      .verifyValidationErrors(validationMessage)
      .fillSingleFileName(inputFileName)
      .interceptFileUploadRequest()
      .clickUploadFilesButton()
      .verifyFileUploadApiCall()
      .verifySingleFileUploadSuccess(fileUploadSuccessToast)
      .verifyFilesAdded([fileDisplayName])

      // Rename the file

      .clickFileDetailsButton(fileDisplayName)
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
      .filterArchivedFiles()
      .clickViewFile(newFileDisplayName)
      .verifyArchiveReason(archiveReason);
  });
});

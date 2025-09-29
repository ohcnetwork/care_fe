import { ErrorMessageItem } from "@/support/commands";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable<Subject> {
      loginByApi(role: string): Chainable<Subject>;
      verifyNotification(msg: string): Chainable<Subject>;
      getAttached(selector: string): Chainable<Subject>;
      clickSubmitButton(buttonText?: string): Chainable<Element>;
      clickCancelButton(buttonText?: string): Chainable<Element>;
      typeAndVerifyOptionNotPresent(
        selector: string,
        value: string,
        emptyMessage: string,
      ): Chainable<void>;
      typeAndSelectOption(
        element: string,
        reference: string,
        skipVerification?: boolean,
      ): Chainable<Element>;
      clickAndMultiSelectOption(
        selector: string,
        symptoms: string | string[],
      ): Chainable<Element>;
      clickAndSelectOption(
        element: string,
        reference?: string,
        options?: { position?: "first" | "last" },
      ): Chainable<Element>;
      verifyAndClickElement(
        element: string,
        reference: string | RegExp,
      ): Chainable<Element>;
      preventPrint(): Chainable<Window>;
      closeNotification(): Chainable<JQuery<HTMLElement>>;
      verifyContentPresence(
        selector: string,
        texts: string[],
      ): Chainable<Element>;
      saveCurrentUrl(): Chainable<Subject>;
      navigateToSavedUrl(): Chainable<Subject>;
      verifyErrorMessages(errors: ErrorMessageItem[]): Chainable<void>;
      typeIntoField(
        selector: string,
        value: string,
        options?: {
          clearBeforeTyping?: boolean;
          skipVerification?: boolean;
          delay?: number;
          position?: "first" | "last";
        },
      ): Chainable<Element>;
      selectComboboxDropdown(
        labelText: string,
        value: string,
        unit?: string,
      ): Chainable<Element>;
      clickAndSelectOptionV2(
        selector: string,
        reference: string,
      ): Chainable<Element>;
      typeAndSelectOptionV2(
        labelText: string,
        value: string,
      ): Chainable<Element>;
      clearAndTypeIntoField(
        selector: string,
        value: string,
      ): Chainable<JQuery<HTMLElement>>;
      getFacilityIdAndNavigate(path?: string): Chainable<string>;
      clickRadioButton(
        labelText: string,
        buttonValue: string,
      ): Chainable<Element>;
      clickConfirmAction(label: string): Chainable<JQuery<HTMLElement>>;
    }
  }
}

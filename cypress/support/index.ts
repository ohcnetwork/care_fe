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
        reference: string,
      ): Chainable<Element>;
      verifyAndClickElement(
        element: string,
        reference: string,
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
        },
      ): Chainable<Element>;
    }
  }
}

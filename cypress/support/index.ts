import "./commands";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable<Subject> {
      login(username: string, password: string): Chainable<Subject>;
      refreshApiLogin(username: string, password: string): Chainable<Subject>;
      loginByApi(username: string, password: string): Chainable<Subject>;
      verifyNotification(msg: string): Chainable<Subject>;
      awaitUrl(
        url: string,
        disableLoginVerification?: boolean,
      ): Chainable<Subject>;
      getAttached(selector: string): Chainable<Subject>;
      clearAllFilters(): Chainable<Subject>;
      clickSubmitButton(buttonText?: string): Chainable<Element>;
      clickCancelButton(buttonText?: string): Chainable<Element>;
      typeAndSelectOption(
        element: string,
        referance: string,
      ): Chainable<Element>;
      clickAndMultiSelectOption(
        selector: string,
        symptoms: string | string[],
      ): Chainable<Element>;
      selectRadioOption(name: string, value: string): Chainable<Element>;
      typeAndMultiSelectOption(
        selector: string,
        input: string,
        symptoms: string | string[],
      ): Chainable<Element>;
      clickAndTypeDate(date: string, selector: string): Chainable<Element>;
      clickAndSelectOption(
        element: string,
        reference: string,
      ): Chainable<Element>;
      verifyAndClickElement(
        element: string,
        reference: string,
      ): Chainable<Element>;
      preventPrint(): Chainable<Window>;
      closeNotification(): Chainable<Element>;
      verifyContentPresence(
        selector: string,
        texts: string[],
      ): Chainable<Element>;
    }
  }
}

import "./commands";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable<Subject> {
      login(username: string, password: string): Chainable<Subject>;
      refreshApiLogin(username: string, password: string): Chainable<Subject>;
      loginByApi(username: string, password: string): Chainable<Subject>;
      verifyNotification(msg: string): Chainable<Subject>;
      visitWait(url: string): Chainable<Subject>;
    }
  }
}

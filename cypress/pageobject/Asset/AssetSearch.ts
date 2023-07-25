export class AssetSearchPage {
  typeSearchKeyword(keyword: string) {
    cy.get("[name='search']").type(keyword);
  }

  pressEnter() {
    cy.get("[name='search']").type("{enter}");
  }

  verifyUrlChanged(initialUrl: string) {
    cy.url().should((currentUrl) => {
      expect(currentUrl).not.to.equal(initialUrl);
    });
  }

  verifyAssetIsPresent(assetName: string) {
    cy.get("[data-testid=created-asset-list]")
      .first()
      .should("contain", assetName);
  }
}

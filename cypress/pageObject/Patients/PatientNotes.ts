export class PatientNotes {
  clickNewThreadButton() {
    cy.verifyAndClickElement('[data-cy="new-thread-button"]', "New");
    return this;
  }

  openEncounterNotesTab() {
    cy.get("[role='tablist']").contains("Notes").click();
    return this;
  }

  typeThreadTitle(title: string) {
    cy.typeIntoField('[data-cy="new-thread-title-input"]', title, {
      clearBeforeTyping: true,
    });
    return this;
  }

  clickCreateThreadButton() {
    cy.verifyAndClickElement('[data-cy="create-thread-button"]', "Create");
    cy.verifyNotification("Thread created successfully");
    return this;
  }

  // **4️⃣ Message Handling**
  typeMessage(message: string) {
    cy.typeIntoField('[data-cy="encounter-notes-chat-message-input"]', message);
    return this;
  }

  sendMessage(message: string) {
    if (!message.trim()) return;

    this.typeMessage(message);
    cy.get('[data-cy="send-chat-message-button"]')
      .should("be.visible")
      .should("not.be.disabled")
      .click();

    cy.wait("@sendMessage").its("response.statusCode").should("eq", 200);
  }

  addNewChatMessages(messages: string[]) {
    this.interceptSendMessageRequest();

    messages.forEach((message) => {
      this.sendMessage(message);
    });

    return this;
  }

  verifyMessagesInChat(messages: string[]) {
    cy.verifyContentPresence('[data-cy="chat-messages"]', messages);
    return this;
  }

  verifyMessagesNotExistInChat(messages: string[]) {
    messages.forEach((message) => {
      cy.get('[data-cy="chat-messages"]').contains(message).should("not.exist");
    });
    return this;
  }

  saveCurrentUrl() {
    cy.saveCurrentUrl();
    return this;
  }

  navigateToSavedUrl() {
    cy.navigateToSavedUrl();
    return this;
  }

  // **5️⃣ Thread Switching**
  changeThread(title: string) {
    cy.get('[data-cy="thread-title"]')
      .should("be.visible")
      .contains(title)
      .click();
    return this;
  }

  interceptSendMessageRequest() {
    cy.intercept("POST", "/api/v1/patient/*/thread/*/note/").as("sendMessage");
    return this;
  }
}

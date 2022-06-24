const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    specPattern: [
      "cypress/e2e/dataplane/get-started.cy.js",
      "cypress/e2e/dataplane/add-remove-accessGroup.cy.js",
      "cypress/e2e/dataplane/add-remove-environment.cy.js",
      "cypress/e2e/dataplane/add-remove-permissions.cy.js",
      "cypress/e2e/dataplane/add-remove-secret.cy.js",
      "cypress/e2e/dataplane/add-remove-user.cy.js",
    ]
  },
});

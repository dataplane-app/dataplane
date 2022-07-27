const { defineConfig } = require("cypress");

module.exports = defineConfig({
  projectId: "mxdzm2",
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    specPattern: [
      "cypress/e2e/dataplane/1.get-started.cy.js",
      "cypress/e2e/dataplane/2.add-remove-accessGroup.cy.js",
      "cypress/e2e/dataplane/3.add-remove-environment.cy.js",
      "cypress/e2e/dataplane/4.add-remove-permissions.cy.js",
      "cypress/e2e/dataplane/5.add-remove-secret.cy.js",
      "cypress/e2e/dataplane/6.add-remove-user.cy.js",
      "cypress/e2e/dataplane/7.admin-permission.cy.js",
      "cypress/e2e/dataplane/8.create-pipeline.cy.js",
      "cypress/e2e/dataplane/9.permission-manage-pipelines.cy.js",
      "cypress/e2e/dataplane/10.permission-edit-all-pipelines.cy.js",
    ]
  },
});
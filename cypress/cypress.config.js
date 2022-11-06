const { defineConfig } = require('cypress');

module.exports = defineConfig({
    projectId: 'mxdzm2',
    e2e: {
        setupNodeEvents(on, config) {
            // implement node event listeners here
        },
        specPattern: [
            'cypress/e2e/dataplane/01-get-started.cy.js',
            'cypress/e2e/dataplane/02-add-remove-accessGroup.cy.js',
            'cypress/e2e/dataplane/03-add-remove-environment.cy.js',
            'cypress/e2e/dataplane/04-add-remove-permissions.cy.js',
            'cypress/e2e/dataplane/05-add-remove-secret.cy.js',
            'cypress/e2e/dataplane/06-add-remove-user.cy.js',
            'cypress/e2e/dataplane/07-admin-permission.cy.js',
            'cypress/e2e/dataplane/08-create-pipeline.cy.js',
            'cypress/e2e/dataplane/09-permission-manage-pipelines.cy.js',
            'cypress/e2e/dataplane/10-permission-edit-all-pipelines.cy.js',
            'cypress/e2e/dataplane/11-permission-edit-all-pipelines-access-groups.cy.js',
            'cypress/e2e/dataplane/12-permission-manage-pipelines-access-groups.cy.js',
            'cypress/e2e/dataplane/13-package-installation.cy.js',
            'cypress/e2e/dataplane/13-package-installation.cy.js',
            'cypress/e2e/dataplane/14-add-remove-file.cy.js',
            'cypress/e2e/dataplane/15-deployment.cy.js',
            'cypress/e2e/dataplane/16-deploy-api-trigger.cy.js',
        ],
    },
});

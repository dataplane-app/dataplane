// This test gives pipeline permissions to a user
// for all pipelines in an environment

// #1 Verify user with 'Edit all pipelines' permissions can view pipelines
// #2 Verify user with 'Edit all pipelines' can edit pipeline permissions
// #3 Verify user with 'Edit all pipelines' can run pipelines
// #4 Verify user with 'Edit all pipelines' can edit pipelines
// #5 Verify user without 'Edit all pipelines' permission can't view pipelines

describe('Give pipeline permission to a user', function () {
    it('Login as admin', function () {
        cy.visit('http://localhost:9002/webapp/login');

        cy.get('#email').type('admin@email.com').should('have.value', 'admin@email.com');
        cy.get('#password').type('Hello123!').should('have.value', 'Hello123!');
        cy.contains('button', 'Login').should('exist', { timeout: 6000 }).click();
        cy.url().should('include', '/webapp');
    });

    it('Give "Edit all pipelines" permission to Jimmy', function () {
        // Go to user's page
        cy.contains('Team').should('exist', { timeout: 6000 }).click();
        cy.contains('Jimmy User').should('exist', { timeout: 6000 }).click({ force: true });

        // Give permission
        cy.get('#available_permissions_autocomplete').type('Edit all pipelines', { force: true }).should('have.value', 'Edit all pipelines');
        cy.get('.MuiAutocomplete-popper li[data-option-index="0"]').should('exist', { timeout: 6000 }).click();
        cy.get('#permission-add').should('exist', { timeout: 6000 }).click({ force: true });
        cy.get('#notistack-snackbar').should('contain', 'Success');
    });

    it('Verify permission', { retries: 5 }, function () {
        // Verify
        cy.get('#environment-permissions').children().contains('Edit all pipelines').prev().should('have.css', 'color', 'rgb(248, 0, 0)');
    });

    // #1 Verify user with 'Edit all pipelines' permissions can view pipelines
    it('Login as Jimmy verify pipeline visible', function () {
        cy.visit('http://localhost:9002/webapp/login');

        cy.get('#email').type('environment@email.com').should('have.value', 'environment@email.com');
        cy.get('#password').type('environment123!').should('have.value', 'environment123!');
        cy.contains('button', 'Login').should('exist', { timeout: 6000 }).click();

        cy.get('td h3').first().should('have.text', 'Cypress Pipeline');
    });

    // #2 Verify user with 'Edit all pipelines' can't edit pipeline permissions
    it('Add Permission', function () {
        cy.contains('Pipelines').should('exist', { timeout: 6000 }).click({ force: true });
        cy.contains('button', 'Manage').should('exist', { timeout: 6000 }).click({ force: true });
        cy.contains('Permissions').should('exist', { timeout: 6000 }).click({ force: true });
        cy.get('#notistack-snackbar').should('contain', 'Requires permissions.');
    });

    // #3 Verify user with 'Edit all pipelines' can run pipelines
    it('Run pipeline', function () {
        cy.contains('Pipelines').should('exist', { timeout: 6000 }).click({ force: true });
        cy.contains('button', 'Run').should('exist', { timeout: 6000 }).click({ force: true });
        cy.wait(50);
        cy.get('.react-flow__node')
            .contains('Checkpoint')
            .parent()
            .parent()
            .parent()
            .should('have.css', 'border')
            .and('match', /rgb\(114, 184, 66\)$/);
        cy.wait(1000);
    });

    // #4 Verify user with 'Edit all pipelines' can edit pipelines
    it('Edit pipeline', function () {
        cy.contains('Pipelines').should('exist', { timeout: 6000 }).click({ force: true });
        cy.contains('button', 'Manage').should('exist', { timeout: 6000 }).click({ force: true });
        cy.contains('Edit').should('exist', { timeout: 6000 }).click({ force: true });

        cy.wait(500);
        cy.get('#notistack-snackbar').should('not.contain', 'the requested element is null which the schema does not allow');
    });

    // #5 Verify user without 'Edit all pipelines' permission can't view pipelines
    it('Login as Jane verify pipeline is not visible', function () {
        cy.visit('http://localhost:9002/webapp/login');

        cy.get('#email').type('changeuser@email.com').should('have.value', 'changeuser@email.com');
        cy.get('#password').type('changeuser123!').should('have.value', 'changeuser123!');
        cy.contains('button', 'Login').should('exist', { timeout: 6000 }).click();

        cy.get('td').should('not.exist');

        cy.wait(1000);
    });

    // Clean up
    it('Login as admin', function () {
        cy.visit('http://localhost:9002/webapp/login');

        cy.get('#email').type('admin@email.com').should('have.value', 'admin@email.com');
        cy.get('#password').type('Hello123!').should('have.value', 'Hello123!');
        cy.contains('button', 'Login').should('exist', { timeout: 6000 }).click();
        cy.url().should('include', '/webapp');
    });

    it('Clean up - remove permissions from Jimmy', function () {
        // Go to user's page
        cy.contains('Team').should('exist', { timeout: 6000 }).click();
        cy.contains('Jimmy User').should('exist', { timeout: 6000 }).click({ force: true });

        // Remove permissions
        cy.get('#environment-permissions').children().contains('Edit all pipelines').prev().click();
        cy.get('#notistack-snackbar').should('contain', 'Success');
    });
});

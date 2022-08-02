// This test gives pipeline permissions to an access group
// for all pipelines in an environment

// #1 Verify user belongs to an access group with 'Edit all pipelines' permissions can view pipelines
// #2 Verify user belongs to an access group with 'Edit all pipelines' can edit pipeline permissions
// #3 Verify user belongs to an access group with 'Edit all pipelines' can run pipelines
// #4 Verify user belongs to an access group with 'Edit all pipelines' can edit pipelines
// #5 Verify user doesn't belong to an access group with 'Edit all pipelines' permission can't view pipelines

describe("Access group 'Edit all pipelines' test", function () {
    it('Login as admin', function () {
        cy.visit('http://localhost:9002/webapp/login');

        cy.get('#email').type('admin@email.com').should('have.value', 'admin@email.com');
        cy.get('#password').type('Hello123!').should('have.value', 'Hello123!');
        cy.contains('button', 'Login').click();
        cy.url().should('include', '/webapp');
    });

    it('Add Access group', function () {
        cy.contains('Access groups').click();
        cy.contains('button', 'Add').click();

        cy.get('#name').type('Cy Access Group').should('have.value', 'Cy Access Group');
        cy.get('#description').type('Description').should('have.value', 'Description');

        cy.contains('Save').click();

        cy.get('#notistack-snackbar').should('contain', 'Success');

        cy.contains('Cy Access Group').click();
    });

    it('Add user Jimmy to Access group', function () {
        cy.get('#members_autocomplete_access_group').type('Jimmy User', { force: true }).should('have.value', 'Jimmy User');
        cy.get('.MuiAutocomplete-popper li[data-option-index="0"]').click();
        cy.get('#members_autocomplete_access_group').parent().parent().parent().next().click({ force: true });
        cy.get('#notistack-snackbar').should('contain', 'Success');
    });

    it('Give "Edit all pipelines" permission to Access group', function () {
        cy.get('#available_permissions_autocomplete').type('Edit all pipelines', { force: true }).should('have.value', 'Edit all pipelines');
        cy.get('.MuiAutocomplete-popper li[data-option-index="0"]').click();
        cy.get('#available_permissions_autocomplete').parent().parent().parent().next().click({ force: true });
        cy.get('#notistack-snackbar').should('contain', 'Success');
    });

    it('Verify permission', { retries: 5 }, function () {
        // Verify
        cy.contains('Environment permissions').next().children().contains('Edit all pipelines').prev().should('have.css', 'color', 'rgb(248, 0, 0)');
    });

    // #1 Verify user belongs to an access group with 'Edit all pipelines' permissions can view pipelines
    it('Login as Jimmy verify pipeline visible', function () {
        cy.visit('http://localhost:9002/webapp/login');

        cy.get('#email').type('environment@email.com').should('have.value', 'environment@email.com');
        cy.get('#password').type('environment123!').should('have.value', 'environment123!');
        cy.contains('button', 'Login').click();

        cy.get('td h3').first().should('have.text', 'Cypress Pipeline');
    });

    // #2 Verify user belongs to an access group with 'Edit all pipelines' can edit pipeline permissions
    it('Add Permission', function () {
        cy.contains('Pipelines').click({ force: true });
        cy.contains('button', 'Manage').click({ force: true });
        cy.contains('Permissions').click({ force: true });
        cy.get('#notistack-snackbar').should('contain', 'Requires permissions.');
    });

    // #3 Verify user belongs to an access group with 'Edit all pipelines' can run pipelines
    it('Run pipeline', function () {
        cy.contains('Pipelines').click({ force: true });
        cy.contains('button', 'Run').click({ force: true });
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

    // #4 Verify user belongs to an access group with 'Edit all pipelines' can edit pipelines
    it('Edit pipeline', function () {
        cy.contains('Pipelines').click({ force: true });
        cy.contains('button', 'Manage').click({ force: true });
        cy.contains('Edit').click({ force: true });

        cy.wait(500);
        cy.get('#notistack-snackbar').should('not.contain', 'the requested element is null which the schema does not allow');
    });

    // #5 Verify user doesn't belong to an access group with 'Edit all pipelines' permission can't view pipelines
    it('Login as Jane verify pipeline is not visible', function () {
        cy.visit('http://localhost:9002/webapp/login');

        cy.get('#email').type('changeuser@email.com').should('have.value', 'changeuser@email.com');
        cy.get('#password').type('changeuser123!').should('have.value', 'changeuser123!');
        cy.contains('button', 'Login').click();

        cy.get('td').should('not.exist');

        cy.wait(1000);
    });

    // // Clean up
    // it('Login as admin', function () {
    //     cy.visit('http://localhost:9002/webapp/login');

    //     cy.get('#email').type('admin@email.com').should('have.value', 'admin@email.com');
    //     cy.get('#password').type('Hello123!').should('have.value', 'Hello123!');
    //     cy.contains('button', 'Login').click();
    //     cy.url().should('include', '/webapp');
    // });

    // it('Clean up - remove permissions from Jimmy', function () {
    //     // Go to user's page
    //     cy.contains('Team').click();
    //     cy.contains('Jimmy User').click({ force: true });

    //     // Remove permissions
    //     cy.get('#environment-permissions').children().contains('Edit all pipelines').prev().click();
    //     cy.get('#notistack-snackbar').should('contain', 'Success');
    // });
});

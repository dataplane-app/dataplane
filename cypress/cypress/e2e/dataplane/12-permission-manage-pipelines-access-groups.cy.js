// This test gives pipeline permissions to a user
// for all pipelines in an environment

// #1 Verify user belongs to an access group with 'View all pipelines' permissions can view pipelines
// #2 Verify user belongs to an access group with 'Manage pipeline permissions' can edit pipeline permissions
// #3 Verify user doesn't belong to an access group with 'View all pipelines' permission can't view pipelines

describe('Give pipeline permission to a user', function () {
    it('Login as admin', function () {
        cy.visit('http://localhost:9002/webapp/login');

        cy.get('#email').type('admin@email.com').should('have.value', 'admin@email.com');
        cy.get('#password').type('Hello123!').should('have.value', 'Hello123!');
        cy.contains('button', 'Login').should('exist', { timeout: 6000 }).click();
        cy.url().should('include', '/webapp');
    });

    it('Add Access group', function () {
        cy.contains('Access groups').should('exist', { timeout: 6000 }).click();
        cy.contains('button', 'Add').should('exist', { timeout: 6000 }).click();

        cy.get('#name').type('Pipeline Access Group').should('have.value', 'Pipeline Access Group');
        cy.get('#description').type('Description').should('have.value', 'Description');

        cy.intercept('POST', '/app/private/graphql').as('post');
        cy.contains('Save').should('exist', { timeout: 6000 }).click();

        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);

        cy.contains('Pipeline Access Group').click();
    });

    it('Add user Jimmy to Access group', function () {
        cy.get('#members_autocomplete_access_group').type('Jimmy User', { force: true }).should('have.value', 'Jimmy User');
        cy.intercept('POST', '/app/private/graphql').as('post');
        cy.get('.MuiAutocomplete-popper li[data-option-index="0"]').should('exist', { timeout: 6000 }).click();
        cy.get('#members_autocomplete_access_group').parent().parent().parent().next().should('exist', { timeout: 6000 }).click({ force: true });
        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);
    });

    it('Give "View all pipelines" permission to Access group', function () {
        cy.get('#available_permissions_autocomplete').type('View all pipelines', { force: true }).should('have.value', 'View all pipelines');
        cy.intercept('POST', '/app/private/graphql').as('post');
        cy.get('.MuiAutocomplete-popper li[data-option-index="0"]').should('exist', { timeout: 6000 }).click();
        cy.get('#available_permissions_autocomplete').parent().parent().parent().next().click({ force: true });
        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);
    });

    it('Give "Manage pipeline permissions" permission to Access group', function () {
        cy.get('#available_permissions_autocomplete').type('Manage pipeline permissions', { force: true }).should('have.value', 'Manage pipeline permissions');
        cy.get('.MuiAutocomplete-popper li[data-option-index="0"]').should('exist', { timeout: 6000 }).click();
        cy.intercept('POST', '/app/private/graphql').as('post');
        cy.get('#available_permissions_autocomplete').parent().parent().parent().next().click({ force: true });
        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);
    });

    // #1 Verify user belongs to an access group with 'View all pipelines' permissions can view pipelines
    it('Login as Jimmy verify pipeline visible', function () {
        cy.visit('http://localhost:9002/webapp/login');

        cy.get('#email').type('environment@email.com').should('have.value', 'environment@email.com');
        cy.get('#password').type('environment123!').should('have.value', 'environment123!');
        cy.contains('button', 'Login').should('exist', { timeout: 6000 }).click();

        cy.get('td h3').first().should('have.text', 'Cypress API Pipeline');
    });

    // #2 Verify user belongs to an access group with 'Manage pipeline permissions' can edit pipeline permissions
    it('Add Permission', function () {
        cy.contains('Pipelines').click({ force: true });
        cy.contains('button', 'Manage').should('exist', { timeout: 6000 }).click({ force: true });
        cy.contains('Permissions').should('exist', { timeout: 6000 }).click({ force: true });
        cy.contains('button', 'Add user').should('exist', { timeout: 6000 }).click({ force: true });
        cy.get('#environment_users_autocomplete').type('Jimmy User - environment@email.com', { force: true }).should('have.value', 'Jimmy User - environment@email.com');
        cy.get('.MuiAutocomplete-popper li[data-option-index="0"]').should('exist', { timeout: 6000 }).click();
        cy.get('.MuiDrawer-paper').contains('View').should('exist', { timeout: 6000 }).click();
        cy.contains('button', 'Save').should('exist', { timeout: 6000 }).click({ force: true });
    });

    it('Verify Permission', function () {
        cy.wait(1000);
        cy.get('td h4').contains('Jimmy').parent().parent().next().next().contains('View').prev().should('have.css', 'color', 'rgb(114, 184, 66)');
    });

    // #3 Verify user doesn't belong to an access group with 'View all pipelines' permission can't view pipelines
    it('Login as Jane verify pipeline is not visible', function () {
        cy.visit('http://localhost:9002/webapp/login');

        cy.get('#email').type('changeuser@email.com').should('have.value', 'changeuser@email.com');
        cy.get('#password').type('changeuser123!').should('have.value', 'changeuser123!');
        cy.contains('button', 'Login').should('exist', { timeout: 6000 }).click();

        cy.get('td').should('not.exist');
    });

    // // Clean up
    // it('Login as admin', function () {
    //     cy.visit('http://localhost:9002/webapp/login');

    //     cy.get('#email').type('admin@email.com').should('have.value', 'admin@email.com');
    //     cy.get('#password').type('Hello123!').should('have.value', 'Hello123!');
    //     cy.contains('button', 'Login').click();
    //     cy.url().should('include', '/webapp');
    // });

    // it('Clean up - remove permissions from Jimmy',function () {
    //     // Go to user's page
    //     cy.contains('Team').click();
    //     cy.contains('Jimmy User').click({force: true});

    //     // Remove permissions
    //     cy.get('#environment-permissions').children().contains('View all pipelines').prev().click();
    //     cy.get('#notistack-snackbar').should('contain', 'Success');
    //     cy.get('#environment-permissions').children().contains('Manage pipeline permissions').prev().click();
    //     cy.get('#notistack-snackbar').should('contain', 'Success');
    //     cy.get('#specific-permissions').children().contains('Pipeline Cypress Pipeline [read]').prev().click();
    //     cy.get('#notistack-snackbar').should('contain', 'Success');
    // });
});

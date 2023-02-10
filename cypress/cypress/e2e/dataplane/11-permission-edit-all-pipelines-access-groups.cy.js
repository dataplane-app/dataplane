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
        cy.contains('button', 'Login').should('exist', { timeout: 6000 }).click();
        cy.url().should('include', '/webapp');
    });

    it('Add Access group', function () {
        cy.contains('Access groups').should('exist', { timeout: 6000 }).click();
        cy.contains('button', 'Add').should('exist', { timeout: 6000 }).click();

        cy.get('#name').type('Cy Access Group').should('have.value', 'Cy Access Group');
        cy.get('#description').type('Description').should('have.value', 'Description');

        cy.intercept('POST', '/app/private/graphql').as('post');
        cy.contains('Save').should('exist', { timeout: 6000 }).click();

        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);

        cy.contains('Cy Access Group').should('exist', { timeout: 6000 }).click();
    });

    it('Add user Jimmy to Access group', function () {
        cy.get('#members_autocomplete_access_group').type('Jimmy User', { force: true }).should('have.value', 'Jimmy User');
        cy.intercept('POST', '/app/private/graphql').as('post');
        cy.get('.MuiAutocomplete-popper li[data-option-index="0"]').should('exist', { timeout: 6000 }).click();
        cy.get('#members_autocomplete_access_group').parent().parent().parent().next().should('exist', { timeout: 6000 }).click({ force: true });
        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);
    });

    it('Give "Edit all pipelines" permission to Access group', function () {
        cy.get('#available_permissions_autocomplete').type('Edit all pipelines', { force: true }).should('have.value', 'Edit all pipelines');
        cy.intercept('POST', '/app/private/graphql').as('post');
        cy.get('.MuiAutocomplete-popper li[data-option-index="0"]').should('exist', { timeout: 6000 }).click();
        cy.get('#available_permissions_autocomplete').parent().parent().parent().next().click({ force: true });
        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);
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
        cy.contains('button', 'Login').should('exist', { timeout: 6000 }).click();

        cy.get('td h3').first().should('have.text', 'Cypress API Pipeline');
    });

    // #2 Verify user belongs to an access group with 'Edit all pipelines' can edit pipeline permissions
    it('Add Permission', function () {
        cy.contains('Pipelines').click({ force: true });
        cy.contains('button', 'Manage').should('exist', { timeout: 6000 }).click({ force: true });
        cy.intercept('POST', '/app/private/graphql').as('post');
        cy.contains('Permissions').should('exist', { timeout: 6000 }).click({ force: true });
        cy.wait('@post')
            .its('response.body.errors')
            .then((a) => a[0].message)
            .should('eq', 'Requires permissions.');
    });

    // #3 Verify user belongs to an access group with 'Edit all pipelines' can run pipelines
    it('Run pipeline', function () {
        cy.contains('Pipelines').click({ force: true });
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

    // #4 Verify user belongs to an access group with 'Edit all pipelines' can edit pipelines
    it('Edit pipeline', function () {
        cy.contains('Pipelines').should('exist', { timeout: 6000 }).click({ force: true });
        cy.contains('button', 'Manage').should('exist', { timeout: 6000 }).click({ force: true });
        cy.intercept('POST', '/app/private/graphql').as('post');
        cy.contains('Edit').should('exist', { timeout: 6000 }).click({ force: true });

        cy.wait(500);
        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);
    });

    // #5 Verify user doesn't belong to an access group with 'Edit all pipelines' permission can't view pipelines
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

    it('Clean up - remove Jimmy from access group', function () {
        cy.contains('Access groups').should('exist', { timeout: 6000 }).click();
        cy.contains('Cy Access Group').should('exist', { timeout: 6000 }).click({ force: true });
        cy.intercept('POST', '/app/private/graphql').as('post');
        cy.contains('Jimmy User').prev().should('exist', { timeout: 6000 }).click({ force: true });
        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);

        cy.contains('Edit all pipelines').prev().should('exist', { timeout: 6000 }).click({ force: true });
        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);
    });
});

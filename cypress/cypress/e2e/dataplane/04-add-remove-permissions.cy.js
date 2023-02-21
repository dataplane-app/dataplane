describe('Add Permissions to admin', function () {
    it('Login', function () {
        cy.visit('http://localhost:9002/webapp/login');

        cy.get('#email').type('admin@email.com').should('have.value', 'admin@email.com');
        cy.get('#password').type('Hello123!').should('have.value', 'Hello123!');
        cy.contains('button', 'Login').should('exist', { timeout: 6000 }).click();
        cy.url().should('include', '/webapp');
    });

    it('Add permissions', function () {
        cy.contains('Team').should('exist', { timeout: 6000 }).click();
        cy.contains('admin@email.com').parent().parent().prev().should('exist', { timeout: 6000 }).click();

        cy.get('#available_permissions_autocomplete').type('Manage environments', { force: true }).should('have.value', 'Manage environments');
        cy.get('.MuiAutocomplete-popper li[data-option-index="0"]').should('exist', { timeout: 6000 }).click();
        cy.intercept('POST', '/app/private/graphql').as('post');
        cy.get('#permission-add').click({ force: true });
        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);

        cy.get('#available_permissions_autocomplete').type('Manage users', { force: true }).should('have.value', 'Manage users');
        cy.get('.MuiAutocomplete-popper li[data-option-index="0"]').should('exist', { timeout: 6000 }).click();
        cy.get('#permission-add').click({ force: true });
        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);

        cy.get('#available_permissions_autocomplete').type('Environment admin', { force: true }).should('have.value', 'Environment admin');
        cy.get('.MuiAutocomplete-popper li[data-option-index="0"]').should('exist', { timeout: 6000 }).click();
        cy.get('#permission-add').click({ force: true });
        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);

        cy.get('#available_permissions_autocomplete').type('Add user to environment', { force: true }).should('have.value', 'Add user to environment');
        cy.get('.MuiAutocomplete-popper li[data-option-index="0"]').should('exist', { timeout: 6000 }).click();
        cy.get('#permission-add').click({ force: true });
        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);

        cy.get('#available_permissions_autocomplete').type('Remove user from environment', { force: true }).should('have.value', 'Remove user from environment');
        cy.get('.MuiAutocomplete-popper li[data-option-index="0"]').should('exist', { timeout: 6000 }).click();
        cy.get('#permission-add').click({ force: true });
        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);

        cy.get('#available_permissions_autocomplete').type('Manage permissions', { force: true }).should('have.value', 'Manage permissions');
        cy.get('.MuiAutocomplete-popper li[data-option-index="0"]').should('exist', { timeout: 6000 }).click();
        cy.get('#permission-add').click({ force: true });
        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);

        cy.get('#available_permissions_autocomplete').type('View all pipelines', { force: true }).should('have.value', 'View all pipelines');
        cy.get('.MuiAutocomplete-popper li[data-option-index="0"]').should('exist', { timeout: 6000 }).click();
        cy.get('#permission-add').click({ force: true });
        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);

        cy.get('#available_permissions_autocomplete').type('Edit all pipelines', { force: true }).should('have.value', 'Edit all pipelines');
        cy.get('.MuiAutocomplete-popper li[data-option-index="0"]').should('exist', { timeout: 6000 }).click();
        cy.get('#permission-add').click({ force: true });
        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);

        cy.get('#available_permissions_autocomplete').type('Run all pipelines', { force: true }).should('have.value', 'Run all pipelines');
        cy.get('.MuiAutocomplete-popper li[data-option-index="0"]').should('exist', { timeout: 6000 }).click();
        cy.get('#permission-add').click({ force: true });
        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);

        cy.get('#available_permissions_autocomplete').type('Manage secrets', { force: true }).should('have.value', 'Manage secrets');
        cy.get('.MuiAutocomplete-popper li[data-option-index="0"]').should('exist', { timeout: 6000 }).click();
        cy.get('#permission-add').click({ force: true });
        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);

        cy.get('#available_permissions_autocomplete').type('Manage workers', { force: true }).should('have.value', 'Manage workers');
        cy.get('.MuiAutocomplete-popper li[data-option-index="0"]').should('exist', { timeout: 6000 }).click();
        cy.get('#permission-add').click({ force: true });
        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);

        cy.get('#available_permissions_autocomplete').type('View workers', { force: true }).should('have.value', 'View workers');
        cy.get('.MuiAutocomplete-popper li[data-option-index="0"]').should('exist', { timeout: 6000 }).click();
        cy.get('#permission-add').click({ force: true });
        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);

        cy.get('#available_permissions_autocomplete').type('Deploy pipelines to this environment', { force: true }).should('have.value', 'Deploy pipelines to this environment');
        cy.get('.MuiAutocomplete-popper li[data-option-index="0"]').should('exist', { timeout: 6000 }).click();
        cy.get('#permission-add').click({ force: true });
        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);

        cy.get('#available_permissions_autocomplete')
            .type('Deploy pipelines from this environment', { force: true })
            .should('have.value', 'Deploy pipelines from this environment');
        cy.get('.MuiAutocomplete-popper li[data-option-index="0"]').should('exist', { timeout: 6000 }).click();
        cy.get('#permission-add').click({ force: true });
        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);

        cy.get('#available_permissions_autocomplete').type('View all deployments', { force: true }).should('have.value', 'View all deployments');
        cy.get('.MuiAutocomplete-popper li[data-option-index="0"]').should('exist', { timeout: 6000 }).click();
        cy.get('#permission-add').click({ force: true });
        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);

        cy.get('#available_permissions_autocomplete').type('Create pipelines', { force: true }).should('have.value', 'Create pipelines');
        cy.get('.MuiAutocomplete-popper li[data-option-index="0"]').should('exist', { timeout: 6000 }).click();
        cy.get('#permission-add').click({ force: true });
        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);

        cy.get('#available_permissions_autocomplete').type('Manage pipeline permissions', { force: true }).should('have.value', 'Manage pipeline permissions');
        cy.get('.MuiAutocomplete-popper li[data-option-index="0"]').should('exist', { timeout: 6000 }).click();
        cy.get('#permission-add').click({ force: true });
        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);
        cy.wait(100);
    });

    it('Verify permissions', { retries: 5 }, function () {
        // Make sure Admin permission is there with grayed out trash icon
        cy.get('#platform-permissions').children().contains('Admin').prev().should('have.css', 'color', 'rgba(0, 0, 0, 0.26)');
        cy.get('#platform-permissions').children().contains('Manage environments').prev().should('have.css', 'color', 'rgb(248, 0, 0)');
        cy.get('#platform-permissions').children().contains('Manage users').prev().should('have.css', 'color', 'rgb(248, 0, 0)');

        cy.get('#environment-permissions').children().contains('Environment admin').prev().should('have.css', 'color', 'rgb(248, 0, 0)');
        cy.get('#environment-permissions').children().contains('Add user to environment').prev().should('have.css', 'color', 'rgb(248, 0, 0)');
        cy.get('#environment-permissions').children().contains('Remove user from environment').prev().should('have.css', 'color', 'rgb(248, 0, 0)');
        cy.get('#environment-permissions').children().contains('Manage permissions').prev().should('have.css', 'color', 'rgb(248, 0, 0)');
        cy.get('#environment-permissions').children().contains('View all pipelines').prev().should('have.css', 'color', 'rgb(248, 0, 0)');
        cy.get('#environment-permissions').children().contains('Edit all pipelines').prev().should('have.css', 'color', 'rgb(248, 0, 0)');
        cy.get('#environment-permissions').children().contains('Run all pipelines').prev().should('have.css', 'color', 'rgb(248, 0, 0)');
        cy.get('#environment-permissions').children().contains('Manage secrets').prev().should('have.css', 'color', 'rgb(248, 0, 0)');
        cy.get('#environment-permissions').children().contains('Manage workers').prev().should('have.css', 'color', 'rgb(248, 0, 0)');
        cy.get('#environment-permissions').children().contains('View workers').prev().should('have.css', 'color', 'rgb(248, 0, 0)');
        cy.get('#environment-permissions').children().contains('Deploy pipelines to this environment').prev().should('have.css', 'color', 'rgb(248, 0, 0)');
        cy.get('#environment-permissions').children().contains('Deploy pipelines from this environment').prev().should('have.css', 'color', 'rgb(248, 0, 0)');
        cy.get('#environment-permissions').children().contains('View all deployments').prev().should('have.css', 'color', 'rgb(248, 0, 0)');
        cy.get('#environment-permissions').children().contains('Create pipelines').prev().should('have.css', 'color', 'rgb(248, 0, 0)');
        cy.get('#environment-permissions').children().contains('Manage pipeline permissions').prev().should('have.css', 'color', 'rgb(248, 0, 0)', { timeout: 10000 });
    });

    it('Remove permissions', function () {
        cy.intercept('POST', '/app/private/graphql').as('post');
        cy.get('#platform-permissions').children().contains('Manage environments').prev().click({ force: true });
        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);

        cy.get('#platform-permissions').children().contains('Manage users').prev().click({ force: true });
        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);

        cy.get('#environment-permissions').children().contains('Environment admin').prev().click({ force: true });
        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);

        cy.get('#environment-permissions').children().contains('Add user to environment').prev().click({ force: true });
        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);

        cy.get('#environment-permissions').children().contains('Remove user from environment').prev().click({ force: true });
        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);

        cy.get('#environment-permissions').children().contains('Manage permissions').prev().click({ force: true });
        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);

        cy.get('#environment-permissions').children().contains('View all pipelines').prev().click({ force: true });
        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);

        cy.get('#environment-permissions').children().contains('Edit all pipelines').prev().click({ force: true });
        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);

        cy.get('#environment-permissions').children().contains('Run all pipelines').prev().click({ force: true });
        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);

        cy.get('#environment-permissions').children().contains('Manage secrets').prev().click({ force: true });
        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);

        cy.get('#environment-permissions').children().contains('Manage workers').prev().click({ force: true });
        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);

        cy.get('#environment-permissions').children().contains('View workers').prev().click({ force: true });
        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);

        cy.get('#environment-permissions').children().contains('Deploy pipelines to this environment').prev().click({ force: true });
        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);

        cy.get('#environment-permissions').children().contains('Deploy pipelines from this environment').prev().click({ force: true });
        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);

        cy.get('#environment-permissions').children().contains('View all deployments').prev().click({ force: true });
        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);

        cy.get('#environment-permissions').children().contains('Create pipelines').prev().click({ force: true });
        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);

        cy.get('#environment-permissions').children().contains('Manage pipeline permissions').prev().click({ force: true });
        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);
    });
});

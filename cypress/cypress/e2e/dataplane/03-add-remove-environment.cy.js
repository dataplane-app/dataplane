describe('Add Environment', function () {
    it('Login', function () {
        cy.visit('http://localhost:9002/webapp/login');

        cy.get('#email').type('admin@email.com').should('have.value', 'admin@email.com');
        cy.get('#password').type('Hello123!').should('have.value', 'Hello123!');
        cy.contains('button', 'Login').should('exist', { timeout: 6000 }).click();
        cy.url().should('include', '/webapp');
    });

    it('Add Environment', function () {
        cy.contains('Settings').should('exist', { timeout: 6000 }).click();
        cy.contains('button', 'Add').should('exist', { timeout: 6000 }).click();

        cy.get('#name').type('ProductionCy').should('have.value', 'ProductionCy');
        cy.get('#description').type('Description').should('have.value', 'Description');

        cy.intercept('POST', '/app/private/graphql').as('post');
        cy.get('#environment-save').should('exist', { timeout: 6000 }).click();

        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);
    });

    it('Delete Environment', function () {
        cy.wait(50);
        cy.contains('ProductionCy').should('exist', { timeout: 6000 }).click();

        cy.contains('Delete environment').should('exist', { timeout: 6000 }).click();
        cy.intercept('POST', '/app/private/graphql').as('post');
        cy.contains('Yes').should('exist', { timeout: 6000 }).click();

        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);
    });
});

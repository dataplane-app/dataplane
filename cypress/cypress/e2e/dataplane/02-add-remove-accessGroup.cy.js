describe('Add Access group', function () {
    it('Login', function () {
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

        cy.contains('Save').should('exist', { timeout: 6000 }).click();

        cy.get('#notistack-snackbar').should('contain', 'Success');
    });

    it('Delete Access group', function () {
        cy.contains('Cy Access Group').should('exist', { timeout: 6000 }).click();

        cy.contains('Delete access group').should('exist', { timeout: 6000 }).click();
        cy.contains('Yes').should('exist', { timeout: 6000 }).click();

        cy.get('#notistack-snackbar').should('contain', 'Success');
    });
});

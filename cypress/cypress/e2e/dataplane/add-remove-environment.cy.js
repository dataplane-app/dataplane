describe('Add Environment', function () {
    it('Login', function () {
        cy.visit('http://localhost:9002/webapp/');

        cy.get('#email').type('admin@email.com').should('have.value', 'admin@email.com');
        cy.get('#password').type('Hello123!').should('have.value', 'Hello123!');
        cy.contains('button', 'Login').click();
        cy.url().should('include', '/webapp');
    });

    it('Add Environment', function () {
        cy.contains('Settings').click();
        cy.contains('button', 'Add').click();

        cy.get('#name').type('ProductionCy').should('have.value', 'ProductionCy');
        cy.get('#description').type('Description').should('have.value', 'Description');

        cy.get('#environment-save').click();

        cy.get('#notistack-snackbar').should('contain', 'Environment added: ProductionCy');
    });

    it('Delete Environment', function () {
        cy.contains('ProductionCy').click();

        cy.contains('Delete environment').click();
        cy.contains('Yes').click();

        cy.get('#notistack-snackbar').should('contain', 'Success');
    });
});

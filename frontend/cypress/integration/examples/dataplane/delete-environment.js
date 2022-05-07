describe('Delete Environment', function () {
    it('Login', function () {
        cy.visit('http://localhost:3000/webapp/');

        cy.get('#email').type('admin@email.com').should('have.value', 'admin@email.com');
        cy.get('#password').type('Hello123!').should('have.value', 'Hello123!');
        cy.contains('button', 'Login').click();
        cy.url().should('include', '/webapp');
    });

    it('Delete Environment', function () {
        cy.contains('Settings').click();
        cy.contains('ProductionCy').click();

        cy.contains('Delete environment').click();
        cy.contains('Yes').click();

        cy.get('#notistack-snackbar').should('contain', 'Success');
    });
});

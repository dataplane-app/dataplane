describe('Delete Access group', function () {
    it('Login', function () {
        cy.visit('http://localhost:3000/webapp/');

        cy.get('#email').type('admin@email.com').should('have.value', 'admin@email.com');
        cy.get('#password').type('Hello123!').should('have.value', 'Hello123!');
        cy.contains('button', 'Login').click();
        cy.url().should('include', '/webapp');
    });

    it('Delete Access group', function () {
        cy.contains('Access groups').click();
        cy.contains('Cy Access Group').click();

        cy.contains('Delete access group').click();
        cy.contains('Yes').click();

        cy.get('#notistack-snackbar').should('contain', 'Success');
    });
});

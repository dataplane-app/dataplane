// This is verifies successful installation of
// python package requests==2.28.1

describe('Python package installation', function () {
    it('Login as admin', function () {
        cy.visit('http://localhost:9002/webapp/login');

        cy.get('#email').type('admin@email.com').should('have.value', 'admin@email.com');
        cy.get('#password').type('Hello123!').should('have.value', 'Hello123!');
        cy.contains('button', 'Login').click();
        cy.url().should('include', '/webapp');
        cy.contains('Cypress Pipeline').click();

        cy.get('.react-flow').within(() => {
            cy.get('#long-button').click();
        });

        cy.contains('Code').click();
        cy.contains('Edit').click();

        cy.get('.view-lines').type('requests==2.28.1');
        cy.contains('Install').click({ force: true });
        cy.get('[data-icon="check-circle"]', { timeout: 60000 });
    });
});

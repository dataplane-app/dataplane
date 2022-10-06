// This is verifies successful installation of
// python package requests==2.28.1

describe('Add/remove python file', function () {
    it('Login as admin', function () {
        cy.visit('http://localhost:9002/webapp/login');

        cy.get('#email').type('admin@email.com').should('have.value', 'admin@email.com');
        cy.get('#password').type('Hello123!').should('have.value', 'Hello123!');
        cy.contains('button', 'Login').should('be.visible', { timeout: 6000 }).click();
        cy.url().should('include', '/webapp');
        cy.contains('Cypress Pipeline').should('be.visible', { timeout: 6000 }).click();

        cy.get('.react-flow').within(() => {
            cy.get('#long-button').should('be.visible', { timeout: 6000 }).click();
        });

        cy.contains('Code').should('be.visible', { timeout: 6000 }).click();
        cy.contains('Edit').should('be.visible', { timeout: 6000 }).click();

        cy.get('#new_file_button') //
            .should('be.visible', { timeout: 6000 })
            .click({ force: true })
            .should('be.visible', { timeout: 6000 });
        cy.get('#new_file_input').should('be.visible', { timeout: 6000 }).type('file.py{enter}');

        cy.get('#notistack-snackbar').should('contain', 'File saved.');

        // Click on delete button
        cy.get('.MuiTreeView-root ul > div > div > li:nth-child(3) button:nth-child(2)').click({ force: true });

        cy.contains('Yes').should('be.visible', { timeout: 6000 }).click({ force: true });

        cy.get('#notistack-snackbar').should('contain', 'Success');
    });
});

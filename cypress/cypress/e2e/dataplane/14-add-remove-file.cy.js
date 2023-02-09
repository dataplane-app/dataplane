describe('Add/remove python file', function () {
    it('Login as admin', function () {
        cy.visit('http://localhost:9002/webapp/login');

        cy.get('#email').type('admin@email.com').should('have.value', 'admin@email.com');
        cy.get('#password').type('Hello123!').should('have.value', 'Hello123!');
        cy.contains('button', 'Login').should('exist', { timeout: 6000 }).click();
        cy.url().should('include', '/webapp');
        cy.contains('Cypress Pipeline').should('exist', { timeout: 6000 }).click();

        cy.get('.react-flow').within(() => {
            cy.get('#long-button').should('exist', { timeout: 6000 }).click();
        });

        cy.contains('Code').should('exist', { timeout: 6000 }).click();
        cy.contains('Edit').should('exist', { timeout: 6000 }).click();
        cy.wait(1000);
    });

    it('Make file', function () {
        cy.get('#new_file_button') //
            .should('exist', { timeout: 6000 })
            .click({ force: true })
            .should('exist', { timeout: 6000 });

        cy.intercept('POST', '/app/private/code-files/*').as('post');
        cy.get('#new_file_input').should('exist', { timeout: 6000 }).type('file.py{enter}');

        cy.wait('@post').its('response.statusCode').should('eq', 200);
    });

    it('Type in code editor', function () {
        cy.get('.view-lines.monaco-mouse-cursor-text').click();
        cy.get('.view-lines.monaco-mouse-cursor-text').type('Dataplane Code');
        cy.contains(/^Dataplane Code$/).should('exist', { timeout: 6000 });
    });

    it('Delete file', function () {
        // Click on delete button
        cy.get('.MuiTreeView-root ul > div > div > li:nth-child(3) button:nth-child(2)').click({ force: true });

        cy.intercept('POST', '/app/private/graphql').as('post');
        cy.contains('Yes').should('exist', { timeout: 6000 }).click({ force: true });

        cy.wait('@post').its('response.body.deleteFileNode').should('not.null');
    });
});

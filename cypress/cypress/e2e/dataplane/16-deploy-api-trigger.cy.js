// Tests for deployment and turn off deployment

describe('Deploy API trigger', function () {
    it('Login as admin', function () {
        cy.visit('http://localhost:9002/webapp/login');

        cy.get('#email').type('admin@email.com').should('have.value', 'admin@email.com');
        cy.get('#password').type('Hello123!').should('have.value', 'Hello123!');
        cy.contains('button', 'Login').should('exist', { timeout: 6000 }).click();
        cy.url().should('include', '/webapp');
    });

    it('Deploy API pipeline', function () {
        cy.wait(1000);
        cy.contains('Cypress API Pipeline')
            .first()
            .parent()
            .parent()
            .parent()
            .within(() => {
                cy.contains('Manage').should('exist', { timeout: 6000 }).click({ force: true });
            });
        cy.contains('button', 'Manage').should('exist', { timeout: 6000 }).click({ force: true });
        cy.contains(/^Deploy$/).click({ force: true });
        cy.contains('Environment').parent().type('Development');
        cy.get('.MuiAutocomplete-popper li[data-option-index="0"]').should('exist', { timeout: 6000 }).click();

        cy.contains('Save').should('exist', { timeout: 6000 }).click();

        cy.contains('Python').parent().type('python_1');
        cy.get('.MuiAutocomplete-popper li[data-option-index="0"]').should('exist', { timeout: 6000 }).click();

        // Trigger deployment
        cy.contains('localhost').then((path) => {
            cy.contains('button', 'Deploy')
                .should('exist', { timeout: 6000 })
                .click()
                .then(() => {
                    cy.request('POST', path.text());
                });
        });

        cy.wait(100);
    });
});

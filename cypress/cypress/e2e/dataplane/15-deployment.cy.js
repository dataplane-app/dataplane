// Tests for deployment and turn off deployment

describe('Deployment and deployment turn off', function () {
    it('Login as admin', function () {
        cy.visit('http://localhost:9002/webapp/login');

        cy.get('#email').type('admin@email.com').should('have.value', 'admin@email.com');
        cy.get('#password').type('Hello123!').should('have.value', 'Hello123!');
        cy.contains('button', 'Login').should('be.visible', { timeout: 6000 }).click();
        cy.url().should('include', '/webapp');
    });

    it('Deploy schedule pipeline', function () {
        cy.contains('Cypress Schedule Pipeline')
            .first()
            .parent()
            .parent()
            .parent()
            .within(() => {
                cy.contains('Manage').should('be.visible', { timeout: 6000 }).click({ force: true });
            });
        cy.contains('button', 'Manage').should('be.visible', { timeout: 6000 }).click({ force: true });
        cy.contains(/^Deploy$/).click({ force: true });
        cy.contains('Environment').parent().type('Development');
        cy.get('.MuiAutocomplete-popper li[data-option-index="0"]').should('be.visible', { timeout: 6000 }).click();

        cy.contains('Default worker group').parent().should('be.visible', { timeout: 6000 }).click();
        cy.get('.MuiAutocomplete-popper li[data-option-index="0"]').should('be.visible', { timeout: 6000 }).click();

        cy.contains('button', 'Deploy').should('be.visible', { timeout: 6000 }).click();
        cy.wait(100);
    });

    it('Turn off schedule deployment', function () {
        cy.contains('Cypress Schedule Pipeline')
            .first()
            .parent()
            .parent()
            .parent()
            .within(() => {
                cy.contains('Manage').should('be.visible', { timeout: 6000 }).click({ force: true });
            });

        cy.contains('Turn off').should('be.visible', { timeout: 6000 }).click({ force: true });
        cy.contains('Yes').should('be.visible', { timeout: 6000 }).click({ force: true });

        cy.contains('Cypress Schedule Pipeline')
            .first()
            .parent()
            .parent()
            .parent()
            .within(() => {
                cy.contains('Offline');
            });
    });
});

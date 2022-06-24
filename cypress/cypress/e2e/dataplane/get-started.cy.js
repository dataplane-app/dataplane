describe('Get started', function () {
    it('Register a new platform', function () {
        cy.visit('http://localhost:9002/webapp/get-started');

        cy.get('#business_name').type('Acme', { force: true }).should('have.value', 'Acme');
        cy.get('#timezone-box').type('Europe/London', { force: true }).should('have.value', 'Europe/London');
        cy.get('.MuiAutocomplete-popper').click();

        cy.get('#first_name').type('John').should('have.value', 'John');
        cy.get('#last_name').type('Smith').should('have.value', 'Smith');
        cy.get('#email').type('admin@email.com').should('have.value', 'admin@email.com');
        cy.get('#job_title').type('Manager').should('have.value', 'Manager');
        cy.get('#password').type('Hello123!').should('have.value', 'Hello123!');

        cy.get('.MuiSwitch-input').click();
        cy.get('.MuiSwitch-input').click();

        cy.contains('Next').click();
        cy.url().should('include', '/congratulations');
    });
});

describe('Add User', function () {
    it('Login', function () {
        cy.visit('http://localhost:3000/webapp/');

        cy.get('#email').type('admin@email.com').should('have.value', 'admin@email.com');
        cy.get('#password').type('Hello123!').should('have.value', 'Hello123!');
        cy.contains('button', 'Login').click();
        cy.url().should('include', '/webapp');
    });

    it('Add User', function () {
        cy.contains('Team').click();
        cy.contains('button', 'Add').click();

        cy.get('#first_name').type('John').should('have.value', 'John');
        cy.get('#last_name').type('Smith').should('have.value', 'Smith');
        cy.get('#email').type('johnd@email.com').should('have.value', 'johnd@email.com');
        cy.get('#password').type('Hello123!').should('have.value', 'Hello123!');
        cy.get('#job_title').type('Manager').should('have.value', 'Manager');
        cy.get('#timezone-box').type('Europe/London', { force: true }).should('have.value', 'Europe/London');
        cy.get('.MuiAutocomplete-popper').click();

        cy.contains('Save').click();

        cy.get('#notistack-snackbar').should('contain', 'User created: John Smith (johnd@email.com)');
    });
});

describe('Add User', function () {
    it('Login', function () {
        cy.visit('http://localhost:9002/webapp/');

        cy.get('#email').type('admin@email.com').should('have.value', 'admin@email.com');
        cy.get('#password').type('Hello123!').should('have.value', 'Hello123!');
        cy.contains('button', 'Login').click();
        cy.url().should('include', '/webapp');
    });

    it('Add user', function () {
        cy.contains('Team').click();
        cy.contains('button', 'Add').click();

        cy.get('#first_name').type('John').should('have.value', 'John');
        cy.get('#last_name').type('User').should('have.value', 'User');
        cy.get('#email').type('johnd@email.com').should('have.value', 'johnd@email.com');
        cy.get('#password').type('Hello123!').should('have.value', 'Hello123!');
        cy.get('#job_title').type('Manager').should('have.value', 'Manager');
        cy.get('#timezone-box').type('Europe/London', { force: true }).should('have.value', 'Europe/London');
        cy.get('.MuiAutocomplete-popper').click();

        cy.contains('Save').click();

        cy.get('#notistack-snackbar').should('contain', 'User created: John User (johnd@email.com)');
    });

    it('Remove user', function () {
        cy.contains('John User').click();

        cy.contains('Delete user').click();
        cy.contains('Yes').click();

        cy.get('#notistack-snackbar').should('contain', 'Success');
    });
});

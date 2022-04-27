describe('Create pipeline', function () {
    it('Login', function () {
        cy.visit('http://localhost:3000/webapp/login');

        cy.get('#email').type('admin@email.com').should('have.value', 'admin@email.com');
        cy.get('#password').type('Hello123!').should('have.value', 'Hello123!');

        cy.get('button').click();
    });

    it('Create pipeline', function () {
        cy.url().should('include', '/webapp/');

        cy.contains('Create').click();

        cy.get('#name').type('Cypress Pipeline', { force: true }).should('have.value', 'Cypress Pipeline');
        cy.get('#description').type('This is a description', { force: true }).should('have.value', 'This is a description');
        cy.get('#workerGroup-box').click();
        cy.get('.MuiAutocomplete-popper').click();

        cy.contains('Save').click();
    });

    it('Create Flow', function () {
        cy.url().should('include', '/webapp/pipelines/flow/');
        cy.wait(2000);
        cy.get('#Triggers div:nth-child(2)').trigger('mousedown', { which: 1 });
        cy.get('.react-flow').trigger('mousemove', { clientX: -100, clientY: -100 }).trigger('mouseup', { force: true });
    });
});

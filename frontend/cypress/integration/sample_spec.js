describe('Sign up Test', function () {
    it('Does not do much', function () {
        cy.visit('http://localhost:3000/webapp/get-started');

        cy.getByLabelText('Business name').type('Acme').should('have.value', 'Acme');
        cy.contains('Timezone');

        cy.contains('First name');
        cy.contains('Last name');
        cy.contains('Email');
        cy.contains('Job title');
        cy.contains('Password');

        cy.get('.MuiSwitch-input').click();
        cy.get('.MuiSwitch-input').click();
    });
});

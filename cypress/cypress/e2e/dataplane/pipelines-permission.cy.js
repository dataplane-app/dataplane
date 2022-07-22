// This test gives pipeline permissions to a user
// for all pipelines in an environment 

describe('Give pipeline permission to a user', function () {
    it('Login as admin', function () {
        cy.visit('http://localhost:9002/webapp/login');

        cy.get('#email').type('admin@email.com').should('have.value', 'admin@email.com');
        cy.get('#password').type('Hello123!').should('have.value', 'Hello123!');
        cy.contains('button', 'Login').click();
        cy.url().should('include', '/webapp');
    });

    it('Give "View all pipelines" permission to Jimmy',function () {
        // Go to user's page
        cy.contains('Team').click();
        cy.contains('Jimmy User').click({force: true});

        // Give permission
        cy.get('#available_permissions_autocomplete').type('View all pipelines', { force: true }).should('have.value', 'View all pipelines');
        cy.get('.MuiAutocomplete-popper li[data-option-index="0"]').click();
        cy.get('#permission-add').click({force:true});
        cy.get('#notistack-snackbar').should('contain', 'Success');
    });

    it('Give "Manage pipeline permissions" permission to Jimmy', function () {
        cy.get('#available_permissions_autocomplete').type('Manage pipeline permissions', { force: true }).should('have.value', 'Manage pipeline permissions');
        cy.get('.MuiAutocomplete-popper li[data-option-index="0"]').click();
        cy.get('#permission-add').click({force:true});
        cy.get('#notistack-snackbar').should('contain', 'Success');
    });

    it('Verify permissions',{retries: 5}, function () {
        // Verify
        cy.get('#environment-permissions').children().contains('View all pipelines').prev().should('have.css', 'color', 'rgb(248, 0, 0)');
        cy.get('#environment-permissions').children().contains('Manage pipeline permissions').prev().should('have.css', 'color', 'rgb(248, 0, 0)');
    });


    it('Login as Jimmy verify pipeline visible', function () {
        cy.visit('http://localhost:9002/webapp/login');

        cy.get('#email').type('environment@email.com').should('have.value', 'environment@email.com');
        cy.get('#password').type('environment123!').should('have.value', 'environment123!');
        cy.contains('button', 'Login').click();

        cy.get('td h3').first().should('have.text', 'Cypress Pipeline')
    });

    it('Add Permission', function () {
        cy.contains('Pipelines').click({force: true});
        cy.contains('button', 'Manage').click({force: true});
        cy.contains('Permissions').click({force: true});
        cy.contains('button', 'Add user').click({force: true});
        cy.get('#environment_users_autocomplete').type('Jimmy User - environment@email.com', { force: true }).should('have.value', 'Jimmy User - environment@email.com');
        cy.get('.MuiAutocomplete-popper li[data-option-index="0"]').click();
        cy.get('.MuiDrawer-paper').contains('View').click()
        cy.contains('button', 'Save').click({force: true});
    })
    
    it('Verify Permission', function () {
        cy.get('td h4').contains('Jimmy').parent().parent().next().next().contains('View').prev().should('have.css', 'color', 'rgb(114, 184, 66)');
    })

    
    it('Login as Jane verify pipeline is not visible', function () {
        cy.visit('http://localhost:9002/webapp/login');

        cy.get('#email').type('changeuser@email.com').should('have.value', 'changeuser@email.com');
        cy.get('#password').type('changeuser123!').should('have.value', 'changeuser123!');
        cy.contains('button', 'Login').click();

        cy.get('td').should('not.exist')
    });

});

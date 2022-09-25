describe('Add User', function () {
    it('Login as admin', function () {
        cy.visit('http://localhost:9002/webapp/login');

        cy.get('#email').type('admin@email.com').should('have.value', 'admin@email.com');
        cy.get('#password').type('Hello123!').should('have.value', 'Hello123!');
        cy.contains('button', 'Login').should('be.visible', { timeout: 6000 }).click();
        cy.url().should('include', '/webapp');
    });

    // Add user to be given admin permission
    it('Add user Jimmy', function () {
        cy.contains('Team').should('be.visible', { timeout: 6000 }).click({ force: true });
        cy.contains('button', 'Add').should('be.visible', { timeout: 6000 }).click();

        cy.get('#first_name').type('Jimmy', { force: true }).should('have.value', 'Jimmy');
        cy.get('#last_name').type('User').should('have.value', 'User');
        cy.get('#email').type('environment@email.com').should('have.value', 'environment@email.com');
        cy.get('#password').type('environment123!').should('have.value', 'environment123!');
        cy.get('#job_title').type('User with Admin permissions').should('have.value', 'User with Admin permissions');
        cy.get('#timezone-box').type('Europe/London', { force: true }).should('have.value', 'Europe/London');
        cy.get('.MuiAutocomplete-popper').should('be.visible', { timeout: 6000 }).click();

        cy.contains('Save').should('be.visible', { timeout: 6000 }).click();

        cy.get('#notistack-snackbar').should('contain', 'User created: Jimmy User (environment@email.com)');

        cy.wait(500);
        cy.contains('Jimmy User').should('be.visible', { timeout: 6000 }).click({ force: true });

        // Add to environment
        cy.get('#available_environments_autocomplete').type('Development', { force: true }).should('have.value', 'Development');
        cy.wait(100);
        cy.get('.MuiAutocomplete-popper li[data-option-index="0"]').should('be.visible', { timeout: 6000 }).click();
        cy.get('#environment-add').should('be.visible', { timeout: 6000 }).click({ force: true });
        cy.get('#notistack-snackbar').should('contain', 'Success');

        // cy.get('#available_environments_autocomplete').type('Production', { force: true }).should('have.value', 'Production');
        // cy.get('.MuiAutocomplete-popper li[data-option-index="0"]').click();
        // cy.get('#environment-add').click({force:true});
        // cy.get('#notistack-snackbar').should('contain', 'Success');

        // Verify
        cy.get('#belongs-to-environments').children().contains('Development').prev().should('have.css', 'color', 'rgb(248, 0, 0)');
    });

    // Add user with no permissions
    it('Add user Jane', function () {
        cy.contains('Team').click({ force: true });
        cy.contains('button', 'Add').should('be.visible', { timeout: 6000 }).click();

        cy.get('#first_name').type('Jane', { force: true }).should('have.value', 'Jane');
        cy.get('#last_name').type('User').should('have.value', 'User');
        cy.get('#email').type('changeuser@email.com').should('have.value', 'changeuser@email.com');
        cy.get('#password').type('changeuser123!').should('have.value', 'changeuser123!');
        cy.get('#job_title').type('User with no permissions').should('have.value', 'User with no permissions');
        cy.get('#timezone-box').type('Europe/London', { force: true }).should('have.value', 'Europe/London');
        cy.get('.MuiAutocomplete-popper').should('be.visible', { timeout: 6000 }).click();

        cy.contains('Save').should('be.visible', { timeout: 6000 }).click();
        cy.wait(1500);

        cy.get('#notistack-snackbar').should('contain', 'User created: Jane User (changeuser@email.com)');

        cy.wait(500);
        cy.contains('Jane User').should('be.visible', { timeout: 6000 }).click({ force: true });

        // Add to environment
        cy.get('#available_environments_autocomplete').type('Development', { force: true }).should('have.value', 'Development');
        cy.wait(100);
        cy.get('.MuiAutocomplete-popper li[data-option-index="0"]').should('be.visible', { timeout: 6000 }).click();
        cy.get('#environment-add').should('be.visible', { timeout: 6000 }).click({ force: true });
        cy.get('#notistack-snackbar').should('contain', 'Success');

        // Verify
        cy.get('#belongs-to-environments').children().contains('Development').prev().should('have.css', 'color', 'rgb(248, 0, 0)');
    });

    it('Add user John', function () {
        cy.contains('Team').click({ force: true });
        cy.contains('button', 'Add').should('be.visible', { timeout: 6000 }).click();

        cy.get('#first_name').type('John', { force: true }).should('have.value', 'John');
        cy.get('#last_name').type('User').should('have.value', 'User');
        cy.get('#email').type('johnd@email.com').should('have.value', 'johnd@email.com');
        cy.get('#password').type('Hello123!').should('have.value', 'Hello123!');
        cy.get('#job_title').type('Manager').should('have.value', 'Manager');
        cy.get('#timezone-box').type('Europe/London', { force: true }).should('have.value', 'Europe/London');
        cy.get('.MuiAutocomplete-popper').should('be.visible', { timeout: 6000 }).click();

        cy.contains('Save').should('be.visible', { timeout: 6000 }).click();

        cy.get('#notistack-snackbar').should('contain', 'User created: John User (johnd@email.com)');
    });

    it('Remove user John', function () {
        cy.wait(500);
        cy.contains('John User').click({ force: true });

        cy.contains('Delete user').click();
        cy.contains('Yes').should('be.visible', { timeout: 6000 }).click();

        cy.get('#notistack-snackbar').should('contain', 'Success');
    });
});

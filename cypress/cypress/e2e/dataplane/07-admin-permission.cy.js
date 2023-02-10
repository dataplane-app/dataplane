describe('Give admin permission to a user', function () {
    it('Login as admin', function () {
        cy.visit('http://localhost:9002/webapp/login');

        cy.get('#email').type('admin@email.com').should('have.value', 'admin@email.com');
        cy.get('#password').type('Hello123!').should('have.value', 'Hello123!');
        cy.contains('button', 'Login').should('exist', { timeout: 6000 }).click();
        cy.url().should('include', '/webapp');
    });

    it('Create pipeline', function () {
        cy.url().should('include', '/webapp/');

        cy.contains('Create').should('exist', { timeout: 6000 }).click();

        cy.get('#name').type('Cypress Pipeline', { force: true }).should('have.value', 'Cypress Pipeline');
        cy.get('#description').type('This is a description', { force: true }).should('have.value', 'This is a description');
        cy.get('#workerGroup-box').should('exist', { timeout: 6000 }).click();
        cy.get('.MuiAutocomplete-popper').should('exist', { timeout: 6000 }).click();

        cy.contains('Save').should('exist', { timeout: 6000 }).click();
    });

    it('Create Flow', function () {
        cy.url().should('include', '/webapp/pipelines/flow/');
        cy.wait(50);

        const dataTransfer = new DataTransfer();
        // Play Trigger
        // Add
        cy.get('#Triggers div:nth-child(2)') // Play node
            .should(($el) => {
                expect(Cypress.dom.isDetached($el)).to.eq(false);
            })
            .should('exist', { timeout: 6000 })
            .trigger('dragstart', { dataTransfer, force: true });
        cy.get('.react-flow__renderer').should('exist', { timeout: 6000 }).trigger('drop', { dataTransfer });
        // Move
        cy.get('.react-flow__node-playNode').should('exist', { timeout: 6000 }).trigger('mousedown');
        cy.get('.react-flow__renderer').should('exist', { timeout: 6000 }).trigger('mousemove', 100, 100);
        cy.get('.react-flow__renderer').should('exist', { timeout: 6000 }).trigger('mouseup');

        // Python node
        // Add
        cy.get('#Processors div:nth-child(2)') // Python node
            .should('exist', { timeout: 6000 })
            .trigger('dragstart', { dataTransfer });
        cy.get('.react-flow__renderer').should('exist', { timeout: 6000 }).trigger('drop', { dataTransfer });
        cy.get('[type=submit]').click(); // Save

        // Move
        cy.get('.react-flow__node-pythonNode').should('exist', { timeout: 6000 }).trigger('mousedown');
        cy.get('.react-flow__renderer').should('exist', { timeout: 6000 }).trigger('mousemove', 300, 200);
        cy.get('.react-flow__renderer').should('exist', { timeout: 6000 }).trigger('mouseup');

        // Checkpoint
        // Add
        cy.get('#Checkpoints div:nth-child(2)') // Checkpoint node
            .should('exist', { timeout: 6000 })
            .trigger('dragstart', { dataTransfer });
        cy.get('.react-flow__renderer').should('exist', { timeout: 6000 }).trigger('drop', { dataTransfer });
        // Move
        cy.get('.react-flow__node-checkpointNode').should('exist', { timeout: 6000 }).trigger('mousedown');
        cy.get('.react-flow__renderer').should('exist', { timeout: 6000 }).trigger('mousemove', 500, 100);
        cy.get('.react-flow__renderer').should('exist', { timeout: 6000 }).trigger('mouseup');

        // Connect edges
        cy.get('.react-flow__node').contains('Play').parent().parent().parent().find('.source').should('exist', { timeout: 6000 }).trigger('mousedown', { button: 0 });

        cy.get('.react-flow__node')
            .contains('Python')
            .parent()
            .parent()
            .parent()
            .find('.target')
            .trigger('mousemove')
            .should('exist', { timeout: 6000 })
            .trigger('mouseup', { force: true });

        cy.get('.react-flow__node').contains('Python').parent().parent().parent().find('.source').should('exist', { timeout: 6000 }).trigger('mousedown', { button: 0 });

        cy.get('.react-flow__node')
            .contains('Checkpoint')
            .parent()
            .parent()
            .parent()
            .find('.target')
            .should('exist', { timeout: 6000 })
            .trigger('mousemove')
            .should('exist', { timeout: 6000 })
            .trigger('mouseup', { force: true });

        cy.contains('Save').should('exist', { timeout: 6000 }).click();
        cy.wait(1000);
    });

    it('Give admin permission to Jimmy', function () {
        cy.wait(1000);
        cy.contains('Team').should('exist', { timeout: 6000 }).click({ force: true });
        cy.contains('Jimmy User').should('exist', { timeout: 6000 }).click({ force: true });

        // Give permission
        cy.get('#available_permissions_autocomplete').type('Admin', { force: true }).should('have.value', 'Admin');
        cy.get('.MuiAutocomplete-popper li[data-option-index="0"]').should('exist', { timeout: 6000 }).click();
        cy.intercept('POST', '/app/private/graphql').as('post');
        cy.get('#permission-add').click({ force: true });
        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);

        // Verify
        cy.get('#platform-permissions').children().contains('Admin').prev().should('have.css', 'color', 'rgb(248, 0, 0)');
    });

    it('Login as Jimmy verify pipeline visible', function () {
        cy.visit('http://localhost:9002/webapp/login');

        cy.get('#email').type('environment@email.com').should('have.value', 'environment@email.com');
        cy.get('#password').type('environment123!').should('have.value', 'environment123!');
        cy.contains('button', 'Login').should('exist', { timeout: 6000 }).click();

        cy.get('td h3').first().should('have.text', 'Cypress Pipeline');
    });

    it('Login as Jane verify pipeline is not visible', function () {
        cy.visit('http://localhost:9002/webapp/login');

        cy.get('#email').type('changeuser@email.com').should('have.value', 'changeuser@email.com');
        cy.get('#password').type('changeuser123!').should('have.value', 'changeuser123!');
        cy.contains('button', 'Login').should('exist', { timeout: 6000 }).click();

        cy.get('td').should('not.exist');
    });

    it('Login as admin', function () {
        cy.visit('http://localhost:9002/webapp/login');

        cy.get('#email').type('admin@email.com').should('have.value', 'admin@email.com');
        cy.get('#password').type('Hello123!').should('have.value', 'Hello123!');
        cy.contains('button', 'Login').should('exist', { timeout: 6000 }).click();
        cy.url().should('include', '/webapp');
    });

    it('Remove admin permission to Jimmy', function () {
        cy.contains('Team').should('exist', { timeout: 6000 }).click();
        cy.contains('Jimmy User').should('exist', { timeout: 6000 }).click({ force: true });

        // Remove admin permission
        cy.intercept('POST', '/app/private/graphql').as('post');
        cy.get('#platform-permissions').children().contains('Admin').prev().should('exist', { timeout: 6000 }).click();

        // Verify
        cy.wait('@post').its('response.body.errors').should('not.exist');
        cy.wait('@post').its('response.statusCode').should('eq', 200);
    });
});

Cypress.Commands.add('drag', (selector, { x, y }) => {
    return cy.get(selector).trigger('mousedown', { which: 1 }).trigger('mousemove', { clientX: x, clientY: y }).trigger('mouseup', { force: true });
});

describe('Create pipelines', function () {
    it('Login', function () {
        cy.visit('http://localhost:9002/webapp/login');

        cy.get('#email').type('admin@email.com').should('have.value', 'admin@email.com');
        cy.get('#password').type('Hello123!').should('have.value', 'Hello123!');

        cy.get('button').click();
    });

    it('Create Development schedule pipeline', function () {
        cy.url().should('include', '/webapp/');

        cy.contains('Create').click();

        cy.get('#name').type('Cypress Schedule Pipeline', { force: true }).should('have.value', 'Cypress Schedule Pipeline');
        cy.get('#description').type('Schedule Pipeline', { force: true }).should('have.value', 'Schedule Pipeline');
        cy.get('#workerGroup-box').click();
        cy.get('.MuiAutocomplete-popper').click();

        cy.contains('Save').click();
    });

    it('Create Flow', function () {
        cy.url().should('include', '/webapp/pipelines/flow/');
        cy.wait(50);

        const dataTransfer = new DataTransfer();
        // Schedule Trigger
        // Add
        cy.get('#Triggers div:nth-child(3)') // Schedule node
            .trigger('dragstart', { dataTransfer });
        cy.get('.react-flow__renderer').trigger('drop', { dataTransfer });
        cy.contains('Trigger - Scheduler')
            .next()
            .within(() => {
                cy.get('input').click();
            });

        cy.get('.MuiDrawer-root').within(() => {
            cy.contains('Every minute').click();
            cy.contains('Save').click();
        });

        // Move
        cy.get('.react-flow__node-scheduleNode').trigger('mousedown');
        cy.get('.react-flow__renderer').trigger('mousemove', 100, 100);
        cy.get('.react-flow__renderer').trigger('mouseup');

        // Python node
        // Add
        cy.get('#Processors div:nth-child(2)') // Python node
            .trigger('dragstart', { dataTransfer });
        cy.get('.react-flow__renderer').trigger('drop', { dataTransfer });
        cy.get('[type=submit]').click(); // Save

        // Move
        cy.get('.react-flow__node-pythonNode').trigger('mousedown');
        cy.get('.react-flow__renderer').trigger('mousemove', 300, 200);
        cy.get('.react-flow__renderer').trigger('mouseup');

        // Checkpoint
        // Add
        cy.get('#Checkpoints div:nth-child(2)') // Checkpoint node
            .trigger('dragstart', { dataTransfer });
        cy.get('.react-flow__renderer').trigger('drop', { dataTransfer });
        // Move
        cy.get('.react-flow__node-checkpointNode').trigger('mousedown');
        cy.get('.react-flow__renderer').trigger('mousemove', 500, 100);
        cy.get('.react-flow__renderer').trigger('mouseup');

        // Connect edges
        cy.get('.react-flow__node').contains('Schedule trigger').parent().parent().parent().find('.source').trigger('mousedown', { button: 0 });

        cy.get('.react-flow__node').contains('Python').parent().parent().parent().find('.target').trigger('mousemove').trigger('mouseup', { force: true });

        cy.get('.react-flow__node').contains('Python').parent().parent().parent().find('.source').trigger('mousedown', { button: 0 });

        cy.get('.react-flow__node').contains('Checkpoint').parent().parent().parent().find('.target').trigger('mousemove').trigger('mouseup', { force: true });

        cy.contains('Save').click();
    });

    it('Run Flow', function () {
        cy.wait(200);
        cy.contains('Run').click();
        cy.wait(50);
        cy.get('.react-flow__node')
            .contains('Checkpoint')
            .parent()
            .parent()
            .parent()
            .should('have.css', 'border')
            .and('match', /rgb\(114, 184, 66\)$/);
    });

    // Add play pipeline
    it('Create Development play pipeline', function () {
        cy.contains('Pipelines').click({ force: true });
        cy.contains('Create').click();

        cy.get('#name').type('Cypress Pipeline', { force: true }).should('have.value', 'Cypress Pipeline');
        cy.get('#description').type('This is a description', { force: true }).should('have.value', 'This is a description');
        cy.get('#workerGroup-box').click();
        cy.get('.MuiAutocomplete-popper').click();

        cy.contains('Save').click();
    });

    it('Create Flow', function () {
        cy.url().should('include', '/webapp/pipelines/flow/');
        cy.wait(50);

        const dataTransfer = new DataTransfer();
        // Play Trigger
        // Add
        cy.get('#Triggers div:nth-child(2)') // Play node
            .trigger('dragstart', { dataTransfer });
        cy.get('.react-flow__renderer').trigger('drop', { dataTransfer });
        // Move
        cy.get('.react-flow__node-playNode').trigger('mousedown');
        cy.get('.react-flow__renderer').trigger('mousemove', 100, 100);
        cy.get('.react-flow__renderer').trigger('mouseup');

        // Python node
        // Add
        cy.get('#Processors div:nth-child(2)') // Python node
            .trigger('dragstart', { dataTransfer });
        cy.get('.react-flow__renderer').trigger('drop', { dataTransfer });
        cy.get('[type=submit]').click(); // Save

        // Move
        cy.get('.react-flow__node-pythonNode').trigger('mousedown');
        cy.get('.react-flow__renderer').trigger('mousemove', 300, 200);
        cy.get('.react-flow__renderer').trigger('mouseup');

        // Checkpoint
        // Add
        cy.get('#Checkpoints div:nth-child(2)') // Checkpoint node
            .trigger('dragstart', { dataTransfer });
        cy.get('.react-flow__renderer').trigger('drop', { dataTransfer });
        // Move
        cy.get('.react-flow__node-checkpointNode').trigger('mousedown');
        cy.get('.react-flow__renderer').trigger('mousemove', 500, 100);
        cy.get('.react-flow__renderer').trigger('mouseup');

        // Connect edges
        cy.get('.react-flow__node').contains('Play').parent().parent().parent().find('.source').trigger('mousedown', { button: 0 });

        cy.get('.react-flow__node').contains('Python').parent().parent().parent().find('.target').trigger('mousemove').trigger('mouseup', { force: true });

        cy.get('.react-flow__node').contains('Python').parent().parent().parent().find('.source').trigger('mousedown', { button: 0 });

        cy.get('.react-flow__node').contains('Checkpoint').parent().parent().parent().find('.target').trigger('mousemove').trigger('mouseup', { force: true });

        cy.contains('Save').click();
    });

    it('Run Flow', function () {
        cy.wait(200);
        cy.contains('Run').click();
        cy.wait(50);
        cy.get('.react-flow__node')
            .contains('Checkpoint')
            .parent()
            .parent()
            .parent()
            .should('have.css', 'border')
            .and('match', /rgb\(114, 184, 66\)$/);
    });
    // it('Create Production pipeline', function () {
    //     cy.contains('Pipelines').click({force: true});
    //     cy.url().should('include', '/webapp/');

    //     cy.get('#environment-dropdown').click()
    //     cy.get('li').click();
    //     cy.get('td').should('not.exist')

    //     cy.contains('Create').click();

    //     cy.get('#name').type('Cypress Pipeline', { force: true }).should('have.value', 'Cypress Pipeline');
    //     cy.get('#description').type('This is a description', { force: true }).should('have.value', 'This is a description');
    //     cy.get('#workerGroup-box').click();
    //     cy.get('.MuiAutocomplete-popper').click();

    //     cy.contains('Save').click();
    // });
});

// Cypress.Commands.add('drag', (selector, { x, y }) => {
//     return cy.get(selector).trigger('mousedown', { which: 1 }).trigger('mousemove', { clientX: x, clientY: y }).trigger('mouseup', { force: true });
// });

describe('Create pipelines', { retries: 5 }, function () {
    it('Login', function () {
        cy.visit('http://localhost:9002/webapp/login');

        cy.get('#email').type('admin@email.com').should('have.value', 'admin@email.com');
        cy.get('#password').type('Hello123!').should('have.value', 'Hello123!');

        cy.get('button').should('exist', { timeout: 6000 }).click();
    });

    // Add schedule pipeline
    it('Create Development schedule pipeline', function () {
        cy.url().should('include', '/webapp/');

        cy.contains('Create').should('exist', { timeout: 6000 }).click();

        cy.get('#name').type('Cypress Schedule Pipeline', { force: true }).should('have.value', 'Cypress Schedule Pipeline');
        cy.get('#description').type('Schedule Pipeline', { force: true }).should('have.value', 'Schedule Pipeline');
        cy.get('#workerGroup-box').should('exist', { timeout: 6000 }).click();
        cy.get('.MuiAutocomplete-popper').should('exist', { timeout: 6000 }).click();

        cy.contains('Save').should('exist', { timeout: 6000 }).click();
    });

    it('Create Schedule Flow', function () {
        cy.url().should('include', '/webapp/pipelines/flow/');
        cy.wait(50);

        const dataTransfer = new DataTransfer();
        // Schedule Trigger
        // Add
        cy.get('#drag_scheduleNode') // Schedule node
            .should('exist', { timeout: 6000 })
            .trigger('dragstart', { dataTransfer, force: true })
            .should('exist', { timeout: 6000 });
        cy.get('.react-flow__renderer').should('exist', { timeout: 6000 }).trigger('drop', { dataTransfer });
        cy.contains('Trigger - Scheduler')
            .next()
            .within(() => {
                cy.get('input').click();
            });

        cy.get('.MuiDrawer-root').within(() => {
            cy.contains('Every minute').should('exist', { timeout: 6000 }).click();
            cy.contains('Save').should('exist', { timeout: 6000 }).click();
        });

        // Move
        cy.get('.react-flow__node-scheduleNode').should('exist', { timeout: 6000 }).trigger('mousedown');
        cy.get('.react-flow__renderer').should('exist', { timeout: 6000 }).trigger('mousemove', 100, 100);
        cy.get('.react-flow__renderer').should('exist', { timeout: 6000 }).trigger('mouseup');

        // Python node
        // Add
        cy.get('#drag_pythonNode') // Python node
            .should('exist', { timeout: 6000 })
            .trigger('dragstart', { dataTransfer, force: true })
            .should('exist', { timeout: 6000 });
        cy.get('.react-flow__renderer').should('exist', { timeout: 6000 }).trigger('drop', { dataTransfer });
        cy.get('[type=submit]').should('exist', { timeout: 6000 }).click(); // Save

        // Move
        cy.get('.react-flow__node-pythonNode').should('exist', { timeout: 6000 }).trigger('mousedown');
        cy.get('.react-flow__renderer').should('exist', { timeout: 6000 }).trigger('mousemove', 300, 200);
        cy.get('.react-flow__renderer').should('exist', { timeout: 6000 }).trigger('mouseup');

        // Checkpoint
        // Add
        cy.get('#drag_checkpointNode') // Checkpoint node
            .should('exist', { timeout: 6000 })
            .trigger('dragstart', { dataTransfer, force: true })
            .should('exist', { timeout: 6000 });
        cy.get('.react-flow__renderer').should('exist', { timeout: 6000 }).trigger('drop', { dataTransfer });
        // Move
        cy.get('.react-flow__node-checkpointNode').should('exist', { timeout: 6000 }).trigger('mousedown');
        cy.get('.react-flow__renderer').should('exist', { timeout: 6000 }).trigger('mousemove', 500, 100);
        cy.get('.react-flow__renderer').should('exist', { timeout: 6000 }).trigger('mouseup');

        // Connect edges
        cy.get('.react-flow__node').contains('Schedule trigger').parent().parent().parent().find('.source').should('exist', { timeout: 6000 }).trigger('mousedown', { button: 0 });

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

        cy.contains('Save').click();
    });

    it('Run Schedule Flow', function () {
        cy.contains('button', 'Run').should('exist', { timeout: 6000 }).click();
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
        cy.contains('Create').should('exist', { timeout: 6000 }).click();

        cy.get('#name').type('Cypress Pipeline', { force: true }).should('have.value', 'Cypress Pipeline');
        cy.get('#description').type('This is a description', { force: true }).should('have.value', 'This is a description');
        cy.get('#workerGroup-box').should('exist', { timeout: 6000 }).click();
        cy.get('.MuiAutocomplete-popper').should('exist', { timeout: 6000 }).click();

        cy.contains('Save').should('exist', { timeout: 6000 }).click();
    });

    it('Create Play Flow', function () {
        cy.url().should('include', '/webapp/pipelines/flow/');
        cy.wait(50);

        const dataTransfer = new DataTransfer();
        // Play Trigger
        // Add
        cy.get('#drag_playNode') // Play node //
            .should('exist', { timeout: 6000 })
            .trigger('dragstart', { dataTransfer, force: true })
            .should('exist', { timeout: 6000 });
        // .should('exist', { timeout: 6000 });
        cy.get('.react-flow__renderer').should('exist', { timeout: 6000 }).trigger('drop', { dataTransfer });
        // Move
        cy.get('.react-flow__node-playNode').should('exist', { timeout: 6000 }).trigger('mousedown');
        cy.get('.react-flow__renderer').should('exist', { timeout: 6000 }).trigger('mousemove', 100, 100);
        cy.get('.react-flow__renderer').should('exist', { timeout: 6000 }).trigger('mouseup');

        // Python node
        // Add
        cy.get('#drag_pythonNode') // Python node
            .should('exist', { timeout: 6000 })
            .trigger('dragstart', { dataTransfer, force: true })
            .should('exist', { timeout: 6000 });
        cy.get('.react-flow__renderer').should('exist', { timeout: 6000 }).trigger('drop', { dataTransfer });
        cy.get('[type=submit]').should('exist', { timeout: 6000 }).click(); // Save

        // Move
        cy.get('.react-flow__node-pythonNode').should('exist', { timeout: 6000 }).trigger('mousedown');
        cy.get('.react-flow__renderer').should('exist', { timeout: 6000 }).trigger('mousemove', 300, 200);
        cy.get('.react-flow__renderer').should('exist', { timeout: 6000 }).trigger('mouseup');

        // Checkpoint
        // Add
        cy.get('#drag_checkpointNode') // Checkpoint node
            .should('exist', { timeout: 6000 })
            .trigger('dragstart', { dataTransfer, force: true })
            .should('exist', { timeout: 6000 });
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
            .should('exist', { timeout: 6000 })
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
    });

    it('Run Play Flow', function () {
        cy.contains('button', 'Run').should('exist', { timeout: 6000 }).click();
        cy.wait(50);
        cy.get('.react-flow__node')
            .contains('Checkpoint')
            .parent()
            .parent()
            .parent()
            .should('have.css', 'border')
            .and('match', /rgb\(114, 184, 66\)$/);
    });

    // Add API trigger pipeline
    it('Create Development API trigger pipeline', function () {
        cy.contains('Pipelines').click({ force: true });
        cy.contains('Create').should('exist', { timeout: 6000 }).click();

        cy.get('#name').type('Cypress API Pipeline', { force: true }).should('have.value', 'Cypress API Pipeline');
        cy.get('#description').type('This is a description', { force: true }).should('have.value', 'This is a description');
        cy.get('#workerGroup-box').should('exist', { timeout: 6000 }).click();
        cy.get('.MuiAutocomplete-popper').should('exist', { timeout: 6000 }).click();

        cy.contains('Save').should('exist', { timeout: 6000 }).click();
    });

    it('Create API Flow', function () {
        cy.url().should('include', '/webapp/pipelines/flow/');
        cy.wait(50);

        const dataTransfer = new DataTransfer();

        // Add API Trigger
        cy.get('#drag_apiNode').should('exist', { timeout: 6000 }).trigger('dragstart', { dataTransfer, force: true }).should('exist', { timeout: 6000 });
        cy.get('.react-flow__renderer').should('exist', { timeout: 6000 }).trigger('drop', { dataTransfer });

        cy.get('.MuiDrawer-root').within(() => {
            cy.contains('Save').should('exist', { timeout: 6000 }).click();
        });

        // Move
        cy.get('.react-flow__node-apiNode').should('exist', { timeout: 6000 }).trigger('mousedown');
        cy.get('.react-flow__renderer').should('exist', { timeout: 6000 }).trigger('mousemove', 100, 100);
        cy.get('.react-flow__renderer').should('exist', { timeout: 6000 }).trigger('mouseup');

        // Add Python node
        cy.get('#drag_pythonNode').should('exist', { timeout: 6000 }).trigger('dragstart', { dataTransfer, force: true }).should('exist', { timeout: 6000 });
        cy.get('.react-flow__renderer').should('exist', { timeout: 6000 }).trigger('drop', { dataTransfer });
        cy.get('[type=submit]').should('exist', { timeout: 6000 }).click(); // Save

        // Move
        cy.get('.react-flow__node-pythonNode').should('exist', { timeout: 6000 }).trigger('mousedown');
        cy.get('.react-flow__renderer').should('exist', { timeout: 6000 }).trigger('mousemove', 300, 200);
        cy.get('.react-flow__renderer').should('exist', { timeout: 6000 }).trigger('mouseup');

        // Add Checkpoint
        cy.get('#drag_checkpointNode').should('exist', { timeout: 6000 }).trigger('dragstart', { dataTransfer, force: true }).should('exist', { timeout: 6000 });
        cy.get('.react-flow__renderer').should('exist', { timeout: 6000 }).trigger('drop', { dataTransfer });

        // Move
        cy.get('.react-flow__node-checkpointNode').should('exist', { timeout: 6000 }).trigger('mousedown');
        cy.get('.react-flow__renderer').should('exist', { timeout: 6000 }).trigger('mousemove', 500, 100);
        cy.get('.react-flow__renderer').should('exist', { timeout: 6000 }).trigger('mouseup');

        // Connect edges
        cy.get('.react-flow__node').contains('API trigger').parent().parent().parent().find('.source').should('exist', { timeout: 6000 }).trigger('mousedown', { button: 0 });

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

        cy.contains('Save').click();
    });
});

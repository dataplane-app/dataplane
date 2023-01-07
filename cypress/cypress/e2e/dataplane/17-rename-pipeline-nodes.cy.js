describe('Create pipelines', { retries: 5 }, function () {
    it('Login', function () {
        cy.visit('http://localhost:9002/webapp/login');

        cy.get('#email').type('admin@email.com').should('have.value', 'admin@email.com');
        cy.get('#password').type('Hello123!').should('have.value', 'Hello123!');

        cy.get('button').should('exist', { timeout: 6000 }).click();
    });

    // Add play pipeline
    it('Create Rename pipeline', function () {
        cy.contains('Pipelines').click({ force: true });
        cy.contains('Create').should('exist', { timeout: 6000 }).click();

        cy.get('#name').type('Cypress Rename Pipeline', { force: true }).should('have.value', 'Cypress Rename Pipeline');
        cy.get('#description').type('This is a description', { force: true }).should('have.value', 'This is a description');
        cy.get('#workerGroup-box').should('exist', { timeout: 6000 }).click();
        cy.get('.MuiAutocomplete-popper').should('exist', { timeout: 6000 }).click();

        cy.contains('Save').should('exist', { timeout: 6000 }).click();
    });

    it('Create Play Flow', function () {
        cy.url().should('include', '/webapp/pipelines/flow/');
        cy.wait(50);

        const dataTransfer = new DataTransfer();

        // Python node
        // Add first
        cy.get('#drag_pythonNode') // Python node
            .should('exist', { timeout: 6000 })
            .trigger('dragstart', { dataTransfer, force: true })
            .should('exist', { timeout: 6000 });
        cy.get('.react-flow__renderer').should('exist', { timeout: 6000 }).trigger('drop', { dataTransfer });
        cy.contains('Processor - Python').next().get('#title', { force: true }).should('have.value', 'Python');
        cy.get('[type=submit]').should('exist', { timeout: 6000 }).click(); // Save

        // Add second
        cy.get('#drag_pythonNode') // 2nd Python node
            .should('exist', { timeout: 6000 })
            .trigger('dragstart', { dataTransfer, force: true })
            .should('exist', { timeout: 6000 });
        cy.get('.react-flow__renderer').should('exist', { timeout: 6000 }).trigger('drop', { dataTransfer });
        cy.contains('Processor - Python 1').next().get('#title', { force: true }).should('have.value', 'Python 1');
        cy.contains('Processor - Python 1').next().get('#title', { force: true }).clear({ force: true }).type('Python');
        cy.get('[type=submit]').should('exist', { timeout: 6000 }).click(); // Save
        cy.contains('Each node needs unique naming, "Python" has already been used.').should('exist');
        cy.contains('Processor - Python 1').next().get('#title', { force: true }).clear({ force: true }).type('Python 1');
        cy.get('[type=submit]').should('exist', { timeout: 6000 }).click(); // Save

        // Move
        cy.contains('Python 1').parent().parent().parent().parent().should('exist', { timeout: 6000 }).trigger('mousedown', { force: true });
        // cy.get('.react-flow__node-pythonNode').should('exist', { timeout: 6000 }).trigger('mousedown');
        cy.get('.react-flow__renderer').should('exist', { timeout: 6000 }).trigger('mousemove', 100, 100);
        cy.get('.react-flow__renderer').should('exist', { timeout: 6000 }).trigger('mouseup');

        // Select python 1
        cy.contains('Python 1').parent().parent().next().children().last().click();
        cy.contains('Configure').click();
        cy.contains('Processor - Python 1').next().get('#title', { force: true }).clear({ force: true }).type('Python 2');
        cy.get('[type=submit]').should('exist', { timeout: 6000 }).click(); // Save
        cy.contains('Save').should('exist', { timeout: 6000 }).click(); // Save

        cy.wait(1000);
        // Select python 2
        cy.contains('Python 2').parent().parent().next().children().last().click();
        cy.contains('Configure').click();
        cy.contains('Processor - Python 2').next().get('#title', { force: true }).clear({ force: true }).type('Python');
        cy.get('[type=submit]').should('exist', { timeout: 6000 }).click(); // Save
        cy.contains('Each node needs unique naming, "Python" has already been used.').should('exist');
        cy.contains('Processor - Python 2').next().get('#title', { force: true }).clear({ force: true }).type('Python 3');
        cy.get('[type=submit]').should('exist', { timeout: 6000 }).click(); // Save
    });
});

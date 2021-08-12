const { sqlForPartialUpdate } = require('./sql');

describe('sqlForPartialUpdate', function () {
    test('Table is updated', function () {
        const result = sqlForPartialUpdate(
            { col1: 'someval' },
            { col1: 'col1' });
        expect(result).toEqual({
            setCols: "\"col1\"=$1",
            values: ["someval"],
        });
    });
});

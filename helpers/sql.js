const { BadRequestError } = require("../expressError");

/**
 * Helper function for creating the set clause of an sql update.
 * 
 * @param dataToUpdate {Object} {input1: updatedValue1, input2: updatedValue2, input3: updatedValue3, ...}
 * @param jsToSql {Object} {colName: "column_name", ...}
 * 
 * @returns {Object} {sqlSetCols, dataToUpdate}
 *
 * @example {firstName: "Aliya", age: 32 }
 *   { setCols: '"first_name"=$1, "age"=$2',
 *     values: ['Aliya', 32]
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };

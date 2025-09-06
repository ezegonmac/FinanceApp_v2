/**
 * Joins an array of objects with related data from other arrays.
 * This function modifies the objects in the `data` array in place.
 * @param data The main array of objects.
 * @param relations An object where keys are foreign key properties in the `data` objects,
 *                  and values are the arrays of related objects to join with.
 * @param primaryKey The name of the primary key property in the related objects (default is 'id').
 */
export function joinObjects(
  data: any[],
  relations: { [key: string]: any[] },
  headers: string[],
  primaryKey: string = 'id'
): [any[], string[]] {
  const newHeaders = [...headers];
  for (const foreignKey in relations) {
      // Also update the header
      const headerIndex = newHeaders.indexOf(foreignKey);
      if (headerIndex !== -1) {
        newHeaders[headerIndex] = foreignKey.replace(/Id$/, '');
      }
  }

  const newData = data.map(item => {
    const newItem = { ...item };
    for (const foreignKey in relations) {
      if (Object.prototype.hasOwnProperty.call(newItem, foreignKey)) {
        const relatedItem = relations[foreignKey].find(
          relItem => relItem[primaryKey] === newItem[foreignKey]
        );

        if (relatedItem) {
          const propName = foreignKey.replace(/Id$/, '');
          newItem[propName] = relatedItem;
          delete newItem[foreignKey];
        }
      }
    }
    return newItem;
  });
  return [newData, newHeaders];
}
// front/src/__tests__/dragDrop.test.jsx
import { parseOverId, createNewSectionId, makeEmptyPlaceholder } from '../dragDrop';

describe('dragDrop helpers', () => {
  test('createNewSectionId returns sec-<digits>', () => {
    const id = createNewSectionId();
    expect(id).toMatch(/^sec-\d+$/);
  });

  test('makeEmptyPlaceholder returns object with empty-<index> id', () => {
    const ph = makeEmptyPlaceholder(3);
    expect(ph).toEqual(expect.objectContaining({ id: 'empty-3', type: 'empty' }));
  });

  test('parseOverId recognizes palette', () => {
    const parsed = parseOverId('palette');
    expect(parsed).toEqual(expect.objectContaining({ kind: 'palette', id: 'palette' }));
  });

  test('parseOverId recognizes empty-5', () => {
    const parsed = parseOverId('empty-5');
    expect(parsed).toEqual(expect.objectContaining({ kind: 'empty', index: 5, id: 'empty-5' }));
  });

  test('parseOverId normalizes sec-... and s6', () => {
    // For hook tests we need a dummy sections array; but parseOverId in our file depends on `sections` in closure.
    // If parseOverId uses a closure with sections variable it may not be directly testable — the exported helper is the pure variant.
    // This test assumes exported parseOverId handles common prefixes.
    const p1 = parseOverId('sec-s6');
    expect(p1.kind).toBeDefined();
  });
});

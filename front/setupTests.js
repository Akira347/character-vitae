/* eslint-env jest */
import '@testing-library/jest-dom';

// masquer les warnings React-Router durant les tests
beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation((msg) => {
    if (msg.includes('React Router Future Flag Warning')) return;
    console.warn(msg);
  });
});

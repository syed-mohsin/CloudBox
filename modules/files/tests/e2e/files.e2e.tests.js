'use strict';

describe('Files E2E Tests:', function () {
  describe('Test files page', function () {
    it('Should report missing credentials', function () {
      browser.get('http://localhost:3001/files');
      expect(element.all(by.repeater('file in files')).count()).toEqual(0);
    });
  });
});

'use strict';

(function () {
  // Files Controller Spec
  describe('Files Controller Tests', function () {
    // Initialize global variables
    var FilesController,
      scope,
      $httpBackend,
      $stateParams,
      $location,
      Authentication,
      Files,
      mockFile;

    // The $resource service augments the response object with methods for updating and deleting the resource.
    // If we were to use the standard toEqual matcher, our tests would fail because the test values would not match
    // the responses exactly. To solve the problem, we define a new toEqualData Jasmine matcher.
    // When the toEqualData matcher compares two objects, it takes only object properties into
    // account and ignores methods.
    beforeEach(function () {
      jasmine.addMatchers({
        toEqualData: function (util, customEqualityTesters) {
          return {
            compare: function (actual, expected) {
              return {
                pass: angular.equals(actual, expected)
              };
            }
          };
        }
      });
    });

    // Then we can start by loading the main application module
    beforeEach(module(ApplicationConfiguration.applicationModuleName));

    // The injector ignores leading and trailing underscores here (i.e. _$httpBackend_).
    // This allows us to inject a service but then attach it to a variable
    // with the same name as the service.
    beforeEach(inject(function ($controller, $rootScope, _$location_, _$stateParams_, _$httpBackend_, _Authentication_, _Files_) {
      // Set a new global scope
      scope = $rootScope.$new();

      // Point global variables to injected services
      $stateParams = _$stateParams_;
      $httpBackend = _$httpBackend_;
      $location = _$location_;
      Authentication = _Authentication_;
      Files = _Files_;

      // create mock file
      mockFile = new Files({
        _id: '525a8422f6d0f87f0e407a33',
        title: 'An File about MEAN',
        content: 'MEAN rocks!'
      });

      // Mock logged in user
      Authentication.user = {
        roles: ['user']
      };

      // Initialize the Files controller.
      FilesController = $controller('FilesController', {
        $scope: scope
      });
    }));

    it('$scope.find() should create an array with at least one file object fetched from XHR', inject(function (Files) {
      // Create a sample files array that includes the new file
      var sampleFiles = [mockFile];

      // Set GET response
      $httpBackend.expectGET('api/files').respond(sampleFiles);

      // Run controller functionality
      scope.find();
      $httpBackend.flush();

      // Test scope value
      expect(scope.files).toEqualData(sampleFiles);
    }));

    it('$scope.findOne() should create an array with one file object fetched from XHR using a fileId URL parameter', inject(function (Files) {
      // Set the URL parameter
      $stateParams.fileId = mockFile._id;

      // Set GET response
      $httpBackend.expectGET(/api\/files\/([0-9a-fA-F]{24})$/).respond(mockFile);

      // Run controller functionality
      scope.findOne();
      $httpBackend.flush();

      // Test scope value
      expect(scope.file).toEqualData(mockFile);
    }));

    describe('$scope.create()', function () {
      var sampleFilePostData;

      beforeEach(function () {
        // Create a sample file object
        sampleFilePostData = new Files({
          title: 'An File about MEAN',
          content: 'MEAN rocks!'
        });

        // Fixture mock form input values
        scope.title = 'An File about MEAN';
        scope.content = 'MEAN rocks!';

        spyOn($location, 'path');
      });

      it('should send a POST request with the form input values and then locate to new object URL', inject(function (Files) {
        // Set POST response
        $httpBackend.expectPOST('api/files', sampleFilePostData).respond(mockFile);

        // Run controller functionality
        scope.create(true);
        $httpBackend.flush();

        // Test form inputs are reset
        expect(scope.title).toEqual('');
        expect(scope.content).toEqual('');

        // Test URL redirection after the file was created
        expect($location.path.calls.mostRecent().args[0]).toBe('files/' + mockFile._id);
      }));

      it('should set scope.error if save error', function () {
        var errorMessage = 'this is an error message';
        $httpBackend.expectPOST('api/files', sampleFilePostData).respond(400, {
          message: errorMessage
        });

        scope.create(true);
        $httpBackend.flush();

        expect(scope.error).toBe(errorMessage);
      });
    });

    describe('$scope.update()', function () {
      beforeEach(function () {
        // Mock file in scope
        scope.file = mockFile;
      });

      it('should update a valid file', inject(function (Files) {
        // Set PUT response
        $httpBackend.expectPUT(/api\/files\/([0-9a-fA-F]{24})$/).respond();

        // Run controller functionality
        scope.update(true);
        $httpBackend.flush();

        // Test URL location to new object
        expect($location.path()).toBe('/files/' + mockFile._id);
      }));

      it('should set scope.error to error response message', inject(function (Files) {
        var errorMessage = 'error';
        $httpBackend.expectPUT(/api\/files\/([0-9a-fA-F]{24})$/).respond(400, {
          message: errorMessage
        });

        scope.update(true);
        $httpBackend.flush();

        expect(scope.error).toBe(errorMessage);
      }));
    });

    describe('$scope.remove(file)', function () {
      beforeEach(function () {
        // Create new files array and include the file
        scope.files = [mockFile, {}];

        // Set expected DELETE response
        $httpBackend.expectDELETE(/api\/files\/([0-9a-fA-F]{24})$/).respond(204);

        // Run controller functionality
        scope.remove(mockFile);
      });

      it('should send a DELETE request with a valid fileId and remove the file from the scope', inject(function (Files) {
        expect(scope.files.length).toBe(1);
      }));
    });

    describe('scope.remove()', function () {
      beforeEach(function () {
        spyOn($location, 'path');
        scope.file = mockFile;

        $httpBackend.expectDELETE(/api\/files\/([0-9a-fA-F]{24})$/).respond(204);

        scope.remove();
        $httpBackend.flush();
      });

      it('should redirect to files', function () {
        expect($location.path).toHaveBeenCalledWith('files');
      });
    });
  });
}());

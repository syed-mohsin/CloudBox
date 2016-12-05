'use strict';

// Files controller
angular.module('files').controller('FilesController', ['$scope', '$stateParams', '$location', 'Authentication', 'FileUploader', 'Files',
  function ($scope, $stateParams, $location, Authentication, FileUploader, Files) {
    $scope.authentication = Authentication;
    $scope.Math = Math;
    var uploader = $scope.uploader = new FileUploader({
      url: 'api/files/',
      alias: 'fileItem'
    });

    // FILTERS

    // a sync filter
    uploader.filters.push({
      name: 'syncFilter',
      fn: function(item /*{File|FileLikeObject}*/, options) {
        console.log('syncFilter');
        return this.queue.length < 10;
      }
    });

    // CALLBACKS

    uploader.onWhenAddingFileFailed = function(item /*{File|FileLikeObject}*/, filter, options) {
      console.info('onWhenAddingFileFailed', item, filter, options);
    };
    uploader.onAfterAddingFile = function(fileItem) {
      console.info('onAfterAddingFile', fileItem);
    };
    uploader.onAfterAddingAll = function(addedFileItems) {
      console.info('onAfterAddingAll', addedFileItems);
    };
    uploader.onBeforeUploadItem = function(item) {
      console.info('onBeforeUploadItem', item);
    };
    uploader.onProgressItem = function(fileItem, progress) {
      console.info('onProgressItem', fileItem, progress);
    };
    uploader.onProgressAll = function(progress) {
      console.info('onProgressAll', progress);
    };
    uploader.onSuccessItem = function(fileItem, response, status, headers) {
      console.info('onSuccessItem', fileItem, response, status, headers);
    };
    uploader.onErrorItem = function(fileItem, response, status, headers) {
      console.info('onErrorItem', fileItem, response, status, headers);
    };
    uploader.onCancelItem = function(fileItem, response, status, headers) {
      console.info('onCancelItem', fileItem, response, status, headers);
    };
    uploader.onCompleteItem = function(fileItem, response, status, headers) {
      console.info('onCompleteItem', fileItem, response, status, headers);
    };
    uploader.onCompleteAll = function() {
      console.info('onCompleteAll');
    };

    console.info('uploader', uploader);

    // Create new File
    $scope.create = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'fileForm');

        return false;
      }

      // Create new File object
      var file = new Files({
        title: this.title,
        content: this.content
      });

      // Redirect after save
      file.$save(function (response) {
        $location.path('files/' + response._id);

        // Clear form fields
        $scope.title = '';
        $scope.content = '';
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Remove existing File
    $scope.remove = function (file) {
      if (file) {
        file.$remove();

        for (var i in $scope.files) {
          if ($scope.files[i] === file) {
            $scope.files.splice(i, 1);
          }
        }
      } else {
        $scope.file.$remove(function () {
          $location.path('files');
        });
      }
    };

    // Update existing File
    $scope.update = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'fileForm');

        return false;
      }

      var file = $scope.file;

      file.$update(function () {
        $location.path('files/' + file._id);
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Find a list of my Files
    $scope.find = function () {
      $scope.files = Files.query(function(files) {
        // delete files that don't have the same user id as current user
        for (var i=$scope.files.length-1; i>=0;i--) 
          if ($scope.files[i].user === null || $scope.files[i].user._id  !== Authentication.user._id)
            $scope.files.splice(i,1);
      });
    };

    // Find existing File
    $scope.findOne = function () {
      $scope.file = Files.get({
        fileId: $stateParams.fileId
      });
    };
  }
  ]);

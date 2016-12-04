'use strict';

//Files service used for communicating with the files REST endpoints
angular.module('files').factory('Files', ['$resource',
  function ($resource) {
    return $resource('api/files/:fileId', {
      fileId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
]);

'use strict';

// Setting up route
angular.module('files').config(['$stateProvider',
  function ($stateProvider) {
    // Files state routing
    $stateProvider
      .state('files', {
        abstract: true,
        url: '/files',
        template: '<ui-view/>'
      })
      .state('files.list', {
        url: '',
        templateUrl: 'modules/files/client/views/list-files.client.view.html'
      })
      .state('files.create', {
        url: '/create',
        templateUrl: 'modules/files/client/views/create-file.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      })
      .state('files.view', {
        url: '/:fileId',
        templateUrl: 'modules/files/client/views/view-file.client.view.html'
      })
      .state('files.edit', {
        url: '/:fileId/edit',
        templateUrl: 'modules/files/client/views/edit-file.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      });
  }
]);

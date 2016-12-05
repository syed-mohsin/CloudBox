'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  multer = require('multer'),
  config = require(path.resolve('./config/config')),
  File = mongoose.model('File'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

/**
 * Upload a file
 */
exports.create = function (req, res) {
  var user = req.user;
  var upload = multer(config.uploads.s3FileUpload).single('fileItem');

  if (user) {
    // upload file to Amazon S3
    upload(req, res, function (uploadError) {
      if(uploadError) {
        return res.status(400).send({
          message: 'Error occurred while uploading file'
        });
      } else {
          console.log(req.file);
          var file = new File(req.file);
          file.user = user;
          // save file details 
          file.save(function (err) {
            if (err) {
              return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
              });
            } else {
              res.json(file);
            }
          });
      }
    });
  }
};

/**
 * Show the current file
 */
exports.read = function (req, res) {
  res.json(req.file);
};

/**
 * Update a file
 */
exports.update = function (req, res) {
  var file = req.file;

  file.title = req.body.title;
  file.content = req.body.content;

  file.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(file);
    }
  });
};

/**
 * Delete an file
 */
exports.delete = function (req, res) {
  var file = req.file;

  file.remove(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(file);
    }
  });
};

/**
 * List of Files
 */
exports.list = function (req, res) {
  File.find().sort('-created').populate('user', 'displayName').exec(function (err, files) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(files);
    }
  });
};

/**
 * File middleware
 */
exports.fileByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'File is invalid'
    });
  }

  File.findById(id).populate('user', 'displayName').exec(function (err, file) {
    if (err) {
      return next(err);
    } else if (!file) {
      return res.status(404).send({
        message: 'No file with that identifier has been found'
      });
    }
    req.file = file;
    next();
  });
};

'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  fs = require('fs'),
  mongoose = require('mongoose'),
  multer = require('multer'),
  config = require(path.resolve('./config/config')),
  File = mongoose.model('File'),
  aws_client = require('aws-sdk'),
  fs = require('fs'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));


/**
 * Upload a file
 */
exports.create = function (req, res) {
  var user = req.user;
  var upload = multer(config.uploads.s3FileUpload).single('fileItem');

  var bucket_name = "cloudbucketnextgen";
  var s3 = new aws_client.S3();
  
  if (user) {
    // upload file to Amazon S3
    upload(req, res, function (uploadError) {
      if(uploadError) {
        return res.status(400).send({
          message: 'Error occurred while uploading file'
        });
      } 
      else {
        var file = new File(req.file);
        file.user = user;
        fs.readFile(file.path, function(err, data) {
          if (err) {
            return res.status(400).send({
              message: "failed to read file locally"
            });
          } 
          else {
            console.log("data file was stored into memory");
            var params = {Bucket : bucket_name, Key : file.user._id + "/" + file.filename, Body : data };
            console.log("bucket_name:" + bucket_name);
            console.log("key:" + file.user._id + "/" + file.filename);
            //  console.log("data:" + data);
            s3.putObject(params, function(err, data) {
              if (err) {
                return res.status(400).send({
                  message: err
                });
              } 
              else {
                //  object saved in s3 - store metadata in mongodb
                // save file details 
                console.log("file uploaded to s3");
                file.save(function (err) {
                  if (err) {
                    return res.status(400).send({
                      message: errorHandler.getErrorMessage(err)
                    });
                  } 
                  else {
                    fs.unlink(file.path);
                    res.json(file);
                  }
                });
                  
              }
            });
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
  
    // data from s3
    // fs.write(file.path)
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
      fs.unlink(file.path);
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

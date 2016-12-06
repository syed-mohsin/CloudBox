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

var bucket_names = ["cloudbucketnextgen","cloudbucketnextgenbackup"];

function get_file_from_s3(s3, bucket_names, i, key) {
  var params = {Bucket : bucket_names[i], Key : key};
  s3.getObject(params, function(err, data) {
    if (err) {
      if (i === bucket_names.length) {
        return [err, false];
      }
      else {
        get_file_from_s3(bucket_names, i + 1, key);
      }
    }
    else {
      return [data, true];
    }
  }); 
}

/**
 * Upload a file
 */
exports.create = function (req, res) {
  var user = req.user;
  var upload = multer(config.uploads.s3FileUpload).single('fileItem');

  var bucket_name = bucket_names[0];
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
          } else {
            // file read success
            var file_data = data;

            var bucket_index = 0;
            var success = false;

            // file into all buckets
            (function uploadFileToS3Buckets() {
              if (bucket_index < bucket_names.length) {
                var params = {
                  Bucket : bucket_names[bucket_index], 
                  Key : file.user._id + "/" + file.filename, 
                  Body : data 
                };

                s3.putObject(params, function(err, data) {
                  if (err && bucket_index < bucket_names.length - 1) {
                    // do nothing
                  } else if (err && !success && bucket_index === bucket_names.length - 1) {
                    return res.status(400).send({
                      message: errorHandler.getErrorMessage(err)
                    });
                  } else {
                    //  object saved in s3 - store metadata in mongodb
                    // save file reference only once
                    if (!success) {
                      file.save(function (err) {
                        if (err) {
                          return res.status(400).send({
                            message: err
                          });
                        } else {
                          // file metadata save in mongodb success
                          res.json(file);
                          success = true;
                        }
                      });
                    }
                  }
                  // increment bucket and recurse
                  bucket_index++;
                  uploadFileToS3Buckets();
                });
              }
            }());          
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
  var user = req.user;
  var file = req.file;
  var s3 = new aws_client.S3();
  if (user) {

    var bucket_index = 0;
    var success = false;

    (function getFileFromS3Buckets() {
      if (bucket_index < bucket_names.length) {
        var params = { 
          Bucket : bucket_names[bucket_index], 
          Key : file.user._id + "/" + file.filename 
        };

        s3.getObject(params, function(err, data) {
          if (err && bucket_index < bucket_names.length - 1) {
            // do nothing, keep trying other buckets
          } else if (err && bucket_index === bucket_names.length - 1) {
            return res.status(400).send({
              message: err
            });
          } else {
            // successfully retrieved a file
            fs.writeFile(file.path, data.Body, { flag: 'w' }, function(err) {
              if (err) {
                return res.status(400).send({
                  message: err
                });
              } else {
                // successfully written file locally
                console.log("file retrieved eventually and saved!");
                if (!success) {
                  res.json(file);
                  success = true;
                  return;
                }
                // return res.json(req.file);
              }
            });  
          }
          // increment bucket and recurse
          bucket_index++;
          getFileFromS3Buckets();
        });
      }
    }());
  } 
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
      fs.unlink(file.path, function(err) {
        if (err) {
          console.log("unable to delete file: " + file.path);
        }
      });

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

'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * File Schema
 */
var FileSchema = new Schema({
  storageDate: {
    type: Date,
    default: Date.now
  },
  originalname: {
    type: String,
    default: '',
    trim: true,
    required: 'originalName cannot be blank'
  },
  encoding: {
    type: String,
    default: '',
    trim: true,
    required: 'encoding cannot be blank'
  },
  destination: {
    type: String,
    default: '',
    trim: true,
  },
  filename: {
    type: String,
    default: '',
    required: 'filename cannot be blank'
  },
  path: {
    type: String,
    required: 'path cannot be blank'
  },
  size: {
    type: Number,
    required: 'file size cannot be blank'
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  }
});

mongoose.model('File', FileSchema);

'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  File = mongoose.model('File'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app, agent, credentials, user, file;

/**
 * File routes tests
 */
describe('File CRUD tests', function () {

  before(function (done) {
    // Get application
    app = express.init(mongoose);
    agent = request.agent(app);

    done();
  });

  beforeEach(function (done) {
    // Create user credentials
    credentials = {
      username: 'username',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create a new user
    user = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test@test.com',
      username: credentials.username,
      password: credentials.password,
      provider: 'local'
    });

    // Save a user to the test db and create new file
    user.save(function () {
      file = {
        title: 'File Title',
        content: 'File Content'
      };

      done();
    });
  });

  it('should be able to save an file if logged in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new file
        agent.post('/api/files')
          .send(file)
          .expect(200)
          .end(function (fileSaveErr, fileSaveRes) {
            // Handle file save error
            if (fileSaveErr) {
              return done(fileSaveErr);
            }

            // Get a list of files
            agent.get('/api/files')
              .end(function (filesGetErr, filesGetRes) {
                // Handle file save error
                if (filesGetErr) {
                  return done(filesGetErr);
                }

                // Get files list
                var files = filesGetRes.body;

                // Set assertions
                (files[0].user._id).should.equal(userId);
                (files[0].title).should.match('File Title');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to save an file if not logged in', function (done) {
    agent.post('/api/files')
      .send(file)
      .expect(403)
      .end(function (fileSaveErr, fileSaveRes) {
        // Call the assertion callback
        done(fileSaveErr);
      });
  });

  it('should not be able to save an file if no title is provided', function (done) {
    // Invalidate title field
    file.title = '';

    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new file
        agent.post('/api/files')
          .send(file)
          .expect(400)
          .end(function (fileSaveErr, fileSaveRes) {
            // Set message assertion
            (fileSaveRes.body.message).should.match('Title cannot be blank');

            // Handle file save error
            done(fileSaveErr);
          });
      });
  });

  it('should be able to update an file if signed in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new file
        agent.post('/api/files')
          .send(file)
          .expect(200)
          .end(function (fileSaveErr, fileSaveRes) {
            // Handle file save error
            if (fileSaveErr) {
              return done(fileSaveErr);
            }

            // Update file title
            file.title = 'WHY YOU GOTTA BE SO MEAN?';

            // Update an existing file
            agent.put('/api/files/' + fileSaveRes.body._id)
              .send(file)
              .expect(200)
              .end(function (fileUpdateErr, fileUpdateRes) {
                // Handle file update error
                if (fileUpdateErr) {
                  return done(fileUpdateErr);
                }

                // Set assertions
                (fileUpdateRes.body._id).should.equal(fileSaveRes.body._id);
                (fileUpdateRes.body.title).should.match('WHY YOU GOTTA BE SO MEAN?');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should be able to get a list of files if not signed in', function (done) {
    // Create new file model instance
    var fileObj = new File(file);

    // Save the file
    fileObj.save(function () {
      // Request files
      request(app).get('/api/files')
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Array).and.have.lengthOf(1);

          // Call the assertion callback
          done();
        });

    });
  });

  it('should be able to get a single file if not signed in', function (done) {
    // Create new file model instance
    var fileObj = new File(file);

    // Save the file
    fileObj.save(function () {
      request(app).get('/api/files/' + fileObj._id)
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Object).and.have.property('title', file.title);

          // Call the assertion callback
          done();
        });
    });
  });

  it('should return proper error for single file with an invalid Id, if not signed in', function (done) {
    // test is not a valid mongoose Id
    request(app).get('/api/files/test')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'File is invalid');

        // Call the assertion callback
        done();
      });
  });

  it('should return proper error for single file which doesnt exist, if not signed in', function (done) {
    // This is a valid mongoose Id but a non-existent file
    request(app).get('/api/files/559e9cd815f80b4c256a8f41')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'No file with that identifier has been found');

        // Call the assertion callback
        done();
      });
  });

  it('should be able to delete an file if signed in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new file
        agent.post('/api/files')
          .send(file)
          .expect(200)
          .end(function (fileSaveErr, fileSaveRes) {
            // Handle file save error
            if (fileSaveErr) {
              return done(fileSaveErr);
            }

            // Delete an existing file
            agent.delete('/api/files/' + fileSaveRes.body._id)
              .send(file)
              .expect(200)
              .end(function (fileDeleteErr, fileDeleteRes) {
                // Handle file error error
                if (fileDeleteErr) {
                  return done(fileDeleteErr);
                }

                // Set assertions
                (fileDeleteRes.body._id).should.equal(fileSaveRes.body._id);

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to delete an file if not signed in', function (done) {
    // Set file user
    file.user = user;

    // Create new file model instance
    var fileObj = new File(file);

    // Save the file
    fileObj.save(function () {
      // Try deleting file
      request(app).delete('/api/files/' + fileObj._id)
        .expect(403)
        .end(function (fileDeleteErr, fileDeleteRes) {
          // Set message assertion
          (fileDeleteRes.body.message).should.match('User is not authorized');

          // Handle file error error
          done(fileDeleteErr);
        });

    });
  });

  afterEach(function (done) {
    User.remove().exec(function () {
      File.remove().exec(done);
    });
  });
});

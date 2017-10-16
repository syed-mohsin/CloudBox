# CloudBox - A DropBox implementation

# Video Demo!
https://www.youtube.com/watch?v=JVuzubD73jo&feature=youtu.be

## Description
CloudBox is a cloud-based, resilient file store that can be used to store any file on the cloud in a secure, fault-tolerant manner. The overall goal is to design a web application that allows users to upload files to the server, remove files that were already uploaded to the server and download any file that was uploaded.

## Design Goals
1. File system abstraction :  The application must present an interface that can be used to read, delete or upload files onto the server. The interface must be intuitive and easy to use for any average user with limited programming skills.
2. Isolation : Each user, must be presented with their own ‘virtual’ view of the file system. User A must not be able to view, modify or upload files on behalf of another user B
3. Resiliency : The service must be able to handle errors in the storage mechanism and ensure high degree of availability.
4. Security : The service must prohibit unauthorized access to any data that gets stored/ is being accessed. Data at rest must be protected from theft or accidental data leakage that might arise due to ancillary security issues.
5. Simplicity & Performance : The application must have good efficiency in order to ensure that users have a smooth, consistent experience without unnecessary delays. 

## Security
- Every user must register and use their username and password in order to use CloudBox. This ensures that every user is provided with a virtual file system for themselves without any interference from other users, thereby isolating one user’s operating environment and preventing data leakage.(Isolation)
- The passwords are hashed and stored in mongodb. Thus in the event of a database compromise, user passwords are not leaked as they are hashed with a salt.
- CloudBox provides very high privacy and security for data at rest. This is achieved by encrypting the data before it is stored in the S3 buckets and decrypting them before users download the files. Encryption and decryption are done transparently to the user using AES CBC 256 bit algorithms. Thus, in the unlikely event that a datacenter is compromised and the disks storing the data are stolen, or the S3 database is compromised via software exploits, user data is still encrypted using strong encryption, with a key that is stored elsewhere.
This was a must-have requirement for us since security is one of the biggest challenges faced by cloud services.

## Fault-Tolerance:
- Every file that is uploaded is stored in 2 S3 buckets. (The number of buckets can be configured and the code is designed to work for n buckets.) This is done to ensure that the data is sufficiently replicated so that a failure in one of the S3 buckets will not result in users being locked out of CloudBox. Before that, the metadata associated with the file is stored in mongodb against the respective user. These records from mongodb are used to provide access control to ensure that only authenticated users can read, update or delete their data. The mapping stored in mongodb is only the metadata and consequently much smaller compared to the files themselves.

- The upload function replicates the files while uploading (the contents are encrypted before replicating). The read function attempts to access the data from each one of the buckets until it finds the data. Whenever there is an outage in one of the buckets leading to access failures, the backend reads from the other buckets and presents the data to the user. This ensures very high availability for the service thereby allowing access to user data even in the case of failures. The delete function also ensures that all copies are deleted from all the S3 buckets.

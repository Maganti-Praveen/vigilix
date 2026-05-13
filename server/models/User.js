const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  devices: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
  }],
}, {
  timestamps: true,
});

// Static method to create user with hashed password
userSchema.statics.createUser = async function(email, password, name) {
  const passwordHash = await bcrypt.hash(password, 12);
  const user = new this({ email, passwordHash, name });
  return user.save();
};

// Compare password method
userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.passwordHash);
};

// Remove sensitive data from JSON
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);

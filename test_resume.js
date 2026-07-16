
const mongoose = require('mongoose');
const User = require('./models/User');
const jwt = require('jsonwebtoken');
const config = require('./config');

async function test() {
  await mongoose.connect(config.mongoUri);
  let user = await User.findOne({ email: 'test@test.com' });
  if (!user) user = await User.create({ name: 'Test', email: 'test@test.com', password: 'test', role: 'candidate' });
  
  const token = jwt.sign({ id: user._id }, config.jwt.secret);
  
  // Test update
  const res = await fetch('http://localhost:5000/api/resumes/dummy_id', {
    method: 'PUT',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ parsed: { name: 'New Name' } })
  });
  console.log(await res.text());
  
  process.exit(0);
}
test();


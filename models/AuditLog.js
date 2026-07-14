const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const auditLogSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  username: { type: String, default: 'System' },
  action: { type: String, required: true },
  details: { type: String, default: '' },
  organization: { type: Schema.Types.ObjectId, ref: 'Organization' },
  ip: String
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);

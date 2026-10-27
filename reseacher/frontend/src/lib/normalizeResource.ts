type Row = Record<string, unknown>;
const text = (value: unknown, fallback = '') => typeof value === 'string' ? value : fallback;

export function normalizeResource(resource: string, value: unknown): Row {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid API record.');
  const row = value as Row;
  const id = text(row.id) || text(row._id);
  if (!id) throw new Error('API record is missing its identifier.');
  const base = { ...row, id };
  if (resource === 'visits') {
    const date = text(row.date);
    return { ...base, participantId: text(row.participantId) || text(row.participant_id), studyId: text(row.studyId) || text(row.study_id), participantName: text(row.participantName) || text(row.participant_name), studyName: text(row.studyName) || text(row.study_name), date: date.slice(0, 10), time: text(row.time) || (date.includes('T') ? date.slice(11, 16) : ''), type: text(row.type) || text(row.visit_name, 'Visit'), location: text(row.location, 'Not specified'), coordinator: text(row.coordinator, 'Research team'), status: text(row.status, 'scheduled').toLowerCase() };
  }
  if (resource === 'tasks') {
    const rawStatus = text(row.status, 'pending').toLowerCase();
    return { ...base, studyId: text(row.studyId) || text(row.study_id), studyName: text(row.studyName) || text(row.study_name), participantId: text(row.participantId) || text(row.participant_id), title: text(row.title), dueDate: (text(row.dueDate) || text(row.due_date)).slice(0, 10), dueTime: text(row.dueTime), assignee: text(row.assignee) || text(row.assignee_id), priority: text(row.priority, 'medium').toLowerCase(), type: text(row.type, 'participant_followup'), status: rawStatus === 'todo' ? 'pending' : rawStatus };
  }
  if (resource === 'documents') {
    return { ...base, name: text(row.name) || text(row.title), type: text(row.type, 'Document'), participantId: text(row.participantId) || text(row.participant_id), studyId: text(row.studyId) || text(row.study_id), uploadedBy: text(row.uploadedBy) || text(row.uploaded_by), date: (text(row.date) || text(row.created_at)).slice(0, 10), status: text(row.status, 'active'), size: text(row.size), category: text(row.category, 'Study documents') };
  }
  if (resource === 'messages') {
    const sent = text(row.date) || text(row.sent_at);
    return { ...base, from: text(row.from) || text(row.from_name) || text(row.from_id), to: text(row.to) || text(row.to_name) || text(row.to_id), fromRole: text(row.fromRole), toRole: text(row.toRole), subject: text(row.subject, 'Research message'), body: text(row.body) || text(row.content), preview: text(row.preview) || text(row.content).slice(0, 120), date: sent.slice(0, 10), time: text(row.time) || sent.slice(11, 16), read: row.read === true };
  }
  return base;
}

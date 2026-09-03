import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Send } from 'lucide-react';
import Button from '../components/ui/Button';
import Card, { CardHeader } from '../components/ui/Card';
import { createJob } from '../api/jobs';

export default function CreateJob() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', department: '', location: '', type: 'Full-time',
    experience: '', description: '', skills: '', responsibilities: '', qualifications: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (action) => {
    setSaving(true);
    setError('');
    try {
      await createJob({
        title: form.title,
        department: form.department,
        location: form.location,
        employmentType: form.type,
        experience: form.experience,
        description: form.description,
        skills: form.skills,
        responsibilities: form.responsibilities,
        qualifications: form.qualifications,
        status: action === 'draft' ? 'Draft' : 'Published',
      });
      navigate('/jobs');
    } catch (err) {
      setError(err.message || 'Failed to save job');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';
  const labelClass = 'block text-sm font-medium text-slate-700 mb-1.5';

  return (
    <div className="space-y-6 max-w-3xl">
      <button onClick={() => navigate('/jobs')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Jobs
      </button>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Create Job</h1>
        <p className="text-slate-500 mt-1">Add a new job posting to start screening candidates.</p>
      </div>

      <Card>
        <CardHeader title="Basic Information" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className={labelClass}>Job Title</label>
            <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Senior Frontend Developer" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Department</label>
            <input name="department" value={form.department} onChange={handleChange} placeholder="e.g. Engineering" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Location</label>
            <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. San Francisco, CA or Remote" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Employment Type</label>
            <select name="type" value={form.type} onChange={handleChange} className={inputClass}>
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Contract</option>
              <option>Internship</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Experience Required</label>
            <input name="experience" value={form.experience} onChange={handleChange} placeholder="e.g. 5+ years" className={inputClass} />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Job Description" subtitle="Provide a detailed description for AI matching" />
        <textarea name="description" value={form.description} onChange={handleChange} rows={5} placeholder="Describe the role, team, and what you're looking for..." className={inputClass + ' resize-none'} />
      </Card>

      <Card>
        <CardHeader title="Requirements" />
        <div className="space-y-5">
          <div>
            <label className={labelClass}>Required Skills</label>
            <input name="skills" value={form.skills} onChange={handleChange} placeholder="e.g. React, TypeScript, Node.js (comma separated)" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Responsibilities</label>
            <textarea name="responsibilities" value={form.responsibilities} onChange={handleChange} rows={4} placeholder="List key responsibilities..." className={inputClass + ' resize-none'} />
          </div>
          <div>
            <label className={labelClass}>Qualifications</label>
            <textarea name="qualifications" value={form.qualifications} onChange={handleChange} rows={4} placeholder="List required qualifications..." className={inputClass + ' resize-none'} />
          </div>
        </div>
      </Card>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 pb-6">
        <Button variant="secondary" onClick={() => handleSave('draft')} disabled={saving}>
          <Save className="w-4 h-4" /> Save as Draft
        </Button>
        <Button onClick={() => handleSave('publish')} disabled={saving}>
          <Send className="w-4 h-4" /> {saving ? 'Publishing...' : 'Publish Job'}
        </Button>
      </div>
    </div>
  );
}

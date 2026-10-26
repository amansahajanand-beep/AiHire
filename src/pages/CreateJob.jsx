import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, MapPin, Plus, Save, Send, Sparkles } from 'lucide-react';
import Card from '../components/ui/Card';
import { useAppDispatch } from '../store/hooks';
import LoadingState from '../components/ui/LoadingState';
import { getJob } from '../api/jobs';
import { createJobThunk, updateJobThunk } from '../store/slices/jobsSlice';
import { invalidateHiringData } from '../store';

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'];
const SUGGESTED_SKILLS = ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS'];

const inputClass =
  'w-full h-10 px-3 text-[13px] text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl bg-white shadow-[0_1px_2px_rgba(18,18,28,0.03)] focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400';
const textareaClass =
  'w-full px-3 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl bg-white shadow-[0_1px_2px_rgba(18,18,28,0.03)] focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 resize-y';
const labelClass = 'block text-xs font-semibold text-slate-800 mb-1.5';

function Section({ number, title, subtitle, aside, children }) {
  return (
    <Card padding={false}>
      <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-mono text-[10px] font-semibold text-indigo-600 bg-indigo-50 rounded-md px-1.5 py-1">{number}</span>
          <div className="min-w-0">
            <h2 className="text-[14px] font-semibold tracking-tight text-slate-900">{title}</h2>
            <p className="text-[11.5px] text-slate-500 mt-0.5">{subtitle}</p>
          </div>
        </div>
        {aside}
      </div>
      <div className="p-6">{children}</div>
    </Card>
  );
}

export default function CreateJob() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const isEdit = Boolean(editId);
  const [loadingJob, setLoadingJob] = useState(isEdit);
  const [loadFailed, setLoadFailed] = useState(false);
  const [form, setForm] = useState({
    title: '', department: '', location: '', type: 'Full-time',
    experience: '', description: '', skills: '', responsibilities: '', qualifications: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!editId) return undefined;
    let cancelled = false;
    setLoadingJob(true);
    setLoadFailed(false);
    setError('');
    getJob(editId)
      .then((job) => {
        if (cancelled) return;
        setForm({
          title: job.title || '',
          department: job.department || '',
          location: job.location || '',
          type: job.employmentType || 'Full-time',
          experience: job.experience || '',
          description: job.description || '',
          skills: job.skills || '',
          responsibilities: job.responsibilities || '',
          qualifications: job.qualifications || '',
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadFailed(true);
        setError(err.message || 'Job not found');
      })
      .finally(() => {
        if (!cancelled) setLoadingJob(false);
      });
    return () => {
      cancelled = true;
    };
  }, [editId]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (action) => {
    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        if (!form.title.trim()) {
          setError('Job title is required.');
          return;
        }
        await dispatch(
          updateJobThunk({
            jobId: editId,
            payload: {
              title: form.title.trim(),
              department: form.department,
              location: form.location,
              employmentType: form.type,
              experience: form.experience,
              description: form.description,
              skills: form.skills,
              responsibilities: form.responsibilities,
              qualifications: form.qualifications,
            },
          })
        ).unwrap();
        invalidateHiringData(dispatch);
        navigate('/jobs', { state: { notice: 'Job updated successfully' } });
        return;
      }
      await dispatch(
        createJobThunk({
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
        })
      ).unwrap();
      invalidateHiringData(dispatch);
      navigate('/jobs');
    } catch (err) {
      setError(err.message || 'Failed to save job');
    } finally {
      setSaving(false);
    }
  };

  const addSuggestedSkill = (skill) => {
    const list = form.skills.split(',').map((x) => x.trim()).filter(Boolean);
    if (list.some((x) => x.toLowerCase() === skill.toLowerCase())) return;
    setForm({ ...form, skills: [...list, skill].join(', ') });
  };

  // Live checklist for the "Screening readiness" card (derived from what has been typed so far).
  const skillCount = form.skills.split(',').map((x) => x.trim()).filter(Boolean).length;
  const readiness = [
    { label: 'Job title', done: form.title.trim().length > 0 },
    { label: 'Department & location', done: Boolean(form.department.trim() && form.location.trim()) },
    { label: 'Experience required', done: form.experience.trim().length > 0 },
    { label: 'At least 3 required skills', done: skillCount >= 3 },
    { label: 'Responsibilities & qualifications', done: Boolean(form.responsibilities.trim() && form.qualifications.trim()) },
    { label: 'Description over 200 characters', done: form.description.trim().length > 200 },
  ];
  const readyPct = Math.round((readiness.filter((r) => r.done).length / readiness.length) * 100);

  if (isEdit && loadingJob) return <LoadingState message="Loading job..." />;

  const outlineBtn =
    'inline-flex items-center gap-2 px-3.5 h-9 bg-white border border-slate-200 rounded-xl text-[13px] font-medium text-slate-800 hover:bg-slate-50 shadow-[0_1px_2px_rgba(18,18,28,0.04)] disabled:opacity-50';
  const primaryBtn =
    'inline-flex items-center gap-2 px-4 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-semibold shadow-[0_1px_2px_rgba(107,71,230,0.45),inset_0_1px_0_rgba(255,255,255,0.2)] disabled:opacity-50';

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <button
            onClick={() => navigate('/jobs')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Jobs
          </button>
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight leading-none">{isEdit ? 'Edit Job' : 'Create Job'}</h1>
          <p className="text-sm text-slate-500 mt-2.5">
            {isEdit
              ? 'Update this job posting.'
              : 'Add a new job posting to start screening candidates.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {isEdit ? (
            <button onClick={() => handleSave('update')} disabled={saving || loadFailed} className={primaryBtn}>
              <Save className="w-3.5 h-3.5" /> {saving ? 'Updating...' : 'Update Job'}
            </button>
          ) : (
            <>
              <button onClick={() => handleSave('draft')} disabled={saving} className={outlineBtn}>
                <Save className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.8} /> Save as Draft
              </button>
              <button onClick={() => handleSave('publish')} disabled={saving} className={primaryBtn}>
                <Send className="w-3.5 h-3.5" /> {saving ? 'Publishing...' : 'Publish Job'}
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-5 items-start">
        <div className="space-y-5 min-w-0">
          <Section number="01" title="Basic Information" subtitle="Core details recruiters and AI will use">
            <div className="space-y-4">
              <div>
                <label className={labelClass} htmlFor="job-title">Job Title <span className="text-red-500">*</span></label>
                <input
                  id="job-title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Senior Frontend Developer"
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1.1fr] gap-4">
                <div>
                  <label className={labelClass} htmlFor="job-department">Department</label>
                  <input
                    id="job-department"
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    placeholder="e.g. Engineering"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="job-location">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" strokeWidth={1.8} />
                    <input
                      id="job-location"
                      name="location"
                      value={form.location}
                      onChange={handleChange}
                      placeholder="e.g. Remote, NY"
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </div>
                <div className="md:col-span-2 xl:col-span-1">
                  <span className={labelClass}>Employment Type</span>
                  <div role="radiogroup" aria-label="Employment Type" className="flex h-10 p-1 rounded-xl bg-slate-100 border border-slate-200/70">
                    {EMPLOYMENT_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        role="radio"
                        aria-checked={form.type === type}
                        onClick={() => setForm({ ...form, type })}
                        className={`flex-1 px-2 text-[11.5px] font-medium rounded-lg whitespace-nowrap transition-colors ${
                          form.type === type
                            ? 'bg-white text-slate-900 shadow-[0_1px_2px_rgba(18,18,28,0.1)]'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="md:w-1/2 xl:w-[calc(50%-0.5rem)]">
                <label className={labelClass} htmlFor="job-experience">Experience Required</label>
                <input
                  id="job-experience"
                  name="experience"
                  value={form.experience}
                  onChange={handleChange}
                  placeholder="e.g. 5+ years"
                  className={inputClass}
                />
              </div>
            </div>
          </Section>

          <Section number="02" title="Requirements" subtitle="Skills and criteria for screening">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <label className={labelClass} htmlFor="job-skills">Required Skills</label>
                  <span className="text-[10.5px] text-slate-400 mb-1.5">Separate skills with commas</span>
                </div>
                <input
                  id="job-skills"
                  name="skills"
                  value={form.skills}
                  onChange={handleChange}
                  placeholder="e.g. React, TypeScript, Node.js"
                  className={inputClass}
                />
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 mr-1">
                    <Sparkles className="w-3 h-3 text-indigo-500" /> Suggested
                  </span>
                  {SUGGESTED_SKILLS.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => addSuggestedSkill(skill)}
                      className="inline-flex items-center gap-1 h-6 px-2 rounded-md border border-dashed border-slate-300 bg-white text-[11px] text-slate-700 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50/50 transition-colors"
                    >
                      <Plus className="w-3 h-3" /> {skill}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass} htmlFor="job-responsibilities">Responsibilities</label>
                  <textarea
                    id="job-responsibilities"
                    name="responsibilities"
                    value={form.responsibilities}
                    onChange={handleChange}
                    rows={6}
                    placeholder="List key responsibilities..."
                    className={`${textareaClass} min-h-[140px]`}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="job-qualifications">Qualifications</label>
                  <textarea
                    id="job-qualifications"
                    name="qualifications"
                    value={form.qualifications}
                    onChange={handleChange}
                    rows={6}
                    placeholder="List required qualifications..."
                    className={`${textareaClass} min-h-[140px]`}
                  />
                </div>
              </div>
            </div>
          </Section>

          <Section
            number="03"
            title="Job Description"
            subtitle="Provide a detailed description for AI matching"
            aside={<span className="font-mono text-[10.5px] text-slate-400 shrink-0">{form.description.length} chars</span>}
          >
            <textarea
              id="job-description"
              name="description"
              aria-label="Job Description"
              value={form.description}
              onChange={handleChange}
              rows={10}
              placeholder="Describe the role, team, and what you're looking for..."
              className={`${textareaClass} min-h-[220px]`}
            />
          </Section>
        </div>

        <div className="space-y-4 min-w-0 xl:sticky xl:top-[76px]">
          <Card className="!p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-semibold tracking-tight text-slate-900">Screening readiness</h3>
              <span className="font-mono text-[9.5px] tracking-wider text-slate-400">{readyPct === 100 ? 'READY' : 'IN PROGRESS'}</span>
            </div>
            <p className="mt-3 leading-none">
              <span className="text-[30px] font-bold tracking-tight tabular-nums text-slate-900">{readyPct}</span>
              <span className="text-sm text-slate-500 ml-0.5">%</span>
            </p>
            <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-indigo-600 transition-all duration-300" style={{ width: `${Math.max(readyPct, 3)}%` }} />
            </div>
            <ul className="mt-4 space-y-2.5">
              {readiness.map((item) => (
                <li key={item.label} className="flex items-center gap-2.5 text-xs">
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border ${
                      item.done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {item.done && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                  </span>
                  <span className={item.done ? 'text-slate-800' : 'text-slate-500'}>{item.label}</span>
                </li>
              ))}
            </ul>
          </Card>

          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-indigo-100 flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-indigo-900">HireScop tip</p>
                <p className="text-[11.5px] text-indigo-800/80 mt-1 leading-relaxed">
                  Clear skills, responsibilities, and qualifications help the AI match resumes more accurately.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

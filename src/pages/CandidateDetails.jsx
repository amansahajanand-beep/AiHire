import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronDown, Download, CheckCircle2, Diamond,
  FileText, GraduationCap,
} from 'lucide-react';
import Card from '../components/ui/Card';
import MatchScoreRing from '../components/candidates/MatchScoreRing';
import MatchBreakdown from '../components/candidates/MatchBreakdown';
import LoadingState from '../components/ui/LoadingState';
import HumanReviewLabel from '../components/candidates/HumanReviewLabel';
import { getInitials, formatDate } from '../utils/helpers';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchCandidateById, patchCandidateWorkflow } from '../store/slices/candidatesSlice';
import { downloadCandidateReportPdf } from '../utils/candidateReport';
import { invalidateDashboard } from '../store/slices/dashboardSlice';
import { invalidateActivity } from '../store/slices/activitySlice';

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'resume', label: 'Resume' },
  { id: 'experience', label: 'Experience' },
  { id: 'education', label: 'Education' },
  { id: 'skills', label: 'Skills' },
];

const ACTION_TITLES = {
  Shortlisted: 'Shortlist candidate',
  'Human Review': 'Move to review',
  Rejected: 'Reject candidate',
};

function formatScreenedTime(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export default function CandidateDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState('overview');
  const [actionsOpen, setActionsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // { evaluation | null, title }
  const [noteText, setNoteText] = useState('');
  const [saveError, setSaveError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const entry = useAppSelector((s) => s.candidates.byId[id]);
  const candidate = entry?.data || null;
  const loading = (!entry || entry.status === 'loading') && !candidate;
  const error = entry?.error || '';

  useEffect(() => {
    if (id) dispatch(fetchCandidateById({ id, force: true }));
  }, [dispatch, id]);

  // Choosing an action opens the note dialog first, so the recruiter can record why.
  const openNoteDialog = (evaluation) => {
    setActionsOpen(false);
    setSaveError('');
    setNoteText(candidate?.humanNote || '');
    setPendingAction({ evaluation, title: evaluation ? ACTION_TITLES[evaluation] : 'Add note' });
  };

  const handleSave = async () => {
    const { evaluation } = pendingAction;
    setSaving(true);
    setSaveError('');
    try {
      const payload = { humanNote: noteText.trim() };
      if (evaluation) payload.humanEvaluation = evaluation;
      await dispatch(patchCandidateWorkflow({ id, payload })).unwrap();
      dispatch(invalidateDashboard());
      dispatch(invalidateActivity());
      setPendingAction(null);
    } catch (err) {
      setSaveError(err?.message || 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadError('');
    setDownloading(true);
    try {
      await downloadCandidateReportPdf(candidate);
    } catch (err) {
      setDownloadError(err?.message || 'Could not generate the PDF');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <LoadingState message="Loading candidate..." />;

  if (!candidate) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">{error || 'Candidate not found.'}</p>
        <button onClick={() => navigate('/candidates')} className="mt-4 text-indigo-600 text-sm font-medium">
          Back to Candidates
        </button>
      </div>
    );
  }

  const strengths = candidate.strengths?.length
    ? candidate.strengths
    : candidate.screeningStatus !== 'completed'
      ? ['Screening in progress...']
      : ['See AI Summary below'];
  const weaknesses = candidate.weaknesses?.length
    ? candidate.weaknesses
    : candidate.screeningStatus !== 'completed'
      ? ['Waiting for screening result']
      : candidate.risk
        ? [`Risk flag: ${candidate.risk}`]
        : ['No weak areas returned yet'];
  const screenedOn = candidate.screenedOn ? formatDate(candidate.screenedOn) : '—';
  const screenedTime = candidate.screenedOn ? formatScreenedTime(candidate.screenedOn) : '';
  const showAnalysis = activeTab === 'overview';

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate('/candidates')}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Candidates
      </button>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center shrink-0 shadow-sm ring-4 ring-white">
            <span className="text-xl font-bold text-white">{getInitials(candidate.name)}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">{candidate.name}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{candidate.job || '—'}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-slate-400">
              <span>
                Applied for: <span className="text-slate-600 font-medium">{candidate.job || '—'}</span>
              </span>
              <span className="hidden sm:inline text-slate-300">·</span>
              <span>
                Screened on: <span className="text-slate-600 font-medium">{screenedOn}</span>
                {screenedTime ? (
                  <span className="ml-4">
                    Time: <span className="text-slate-600 font-medium">{screenedTime}</span>
                  </span>
                ) : null}
              </span>
              <span className="hidden sm:inline text-slate-300">·</span>
              <span className="text-slate-600">Current Location: {candidate.location || '—'}</span>
              <span className="hidden sm:inline text-slate-300">·</span>
              <span className="text-slate-600">
                Human Review:{' '}
                <HumanReviewLabel
                  evaluation={candidate.humanEvaluation}
                  note={candidate.humanNote}
                  className="text-slate-600"
                />
              </span>
              <span className="hidden sm:inline text-slate-300">·</span>
              <span className="text-indigo-600 font-medium">{candidate.status || candidate.screeningStatus}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start">
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-slate-400" />
            {downloading ? 'Generating...' : 'Download PDF'}
          </button>
        <div className="relative">
          <button
            onClick={() => setActionsOpen(!actionsOpen)}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            Actions
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>
          {actionsOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setActionsOpen(false)} />
              <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-lg border border-slate-200 shadow-lg py-1 z-50">
                <button onClick={() => openNoteDialog('Shortlisted')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Shortlist</button>
                <button onClick={() => openNoteDialog('Human Review')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Move to Review</button>
                <button onClick={() => openNoteDialog('Rejected')} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Reject</button>
                <div className="my-1 border-t border-slate-100" />
                <button onClick={() => openNoteDialog(null)} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                  {candidate.humanNote ? 'Edit Note' : 'Add Note'}
                </button>
              </div>
            </>
          )}
        </div>
        </div>
      </div>

      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" role="dialog" aria-modal="true">
            <h2 className="text-lg font-bold text-slate-900">{pendingAction.title}</h2>
            <p className="text-sm text-slate-500 mt-1">
              {pendingAction.evaluation
                ? 'Add a note explaining the reason for this action (optional).'
                : 'Add remarks or feedback about this candidate.'}
            </p>
            <textarea
              autoFocus
              rows={5}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              maxLength={2000}
              placeholder="Write your note here…"
              className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
            {saveError && <p className="mt-2 text-sm text-red-600">{saveError}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setPendingAction(null)}
                disabled={saving}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 ${
                  pendingAction.evaluation === 'Rejected' ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {saving ? 'Saving…' : pendingAction.evaluation ? 'Confirm' : 'Save note'}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{error}</div>}
      {downloadError && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{downloadError}</div>}

      <div className="border-b border-slate-200 overflow-x-auto">
        <div className="flex min-w-max">
          {tabs.map(({ id: tabId, label }) => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tabId
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {showAnalysis && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card className="!p-6">
            <h3 className="text-base font-bold text-slate-900 mb-6">AI Match Score</h3>
            <div className="flex flex-col items-center pb-2">
              <MatchScoreRing score={candidate.score || 0} size={176} showLabel={false} />
              <p className="text-sm text-slate-500 mt-3 text-center max-w-xs leading-relaxed">
                {candidate.status || candidate.humanEvaluation || 'Screened profile'}
              </p>
            </div>
          </Card>

          <Card className="!p-6">
            <h3 className="text-base font-bold text-slate-900 mb-6">AI Match Breakdown</h3>
            <MatchBreakdown breakdown={candidate.breakdown} />
          </Card>

          <Card className="!p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Strengths</h3>
            <ul className="space-y-3.5">
              {strengths.map((s) => (
                <li key={s} className="flex items-start gap-3">
                  <CheckCircle2 className="w-[18px] h-[18px] text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-slate-600 leading-snug">{s}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="!p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Missing / Weak Areas</h3>
            <ul className="space-y-3.5">
              {weaknesses.map((w) => (
                <li key={w} className="flex items-start gap-3">
                  <Diamond className="w-3.5 h-3.5 text-red-500 fill-red-500 mt-1 shrink-0" />
                  <span className="text-sm text-slate-600 leading-snug">{w}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="!p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900">Recruiter Note</h3>
              <button
                onClick={() => openNoteDialog(null)}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                {candidate.humanNote ? 'Edit' : 'Add note'}
              </button>
            </div>
            {candidate.humanNote ? (
              <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{candidate.humanNote}</p>
            ) : (
              <p className="text-sm text-slate-400">No note yet. Add remarks or the reason for your decision.</p>
            )}
          </Card>

          {(candidate.summary || candidate.growthPattern) && (
            <Card className="!p-6 lg:col-span-2">
              <h3 className="text-base font-bold text-slate-900 mb-3">Executive Summary</h3>
              {candidate.growthPattern && (
                <p className="text-sm text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2 mb-3">
                  Growth Pattern: {candidate.growthPattern}
                </p>
              )}
              <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                {candidate.summary || candidate.remarks}
              </p>
            </Card>
          )}

          {(candidate.interviewQuestions || []).length > 0 && (
            <Card className="!p-6 lg:col-span-2">
              <h3 className="text-base font-bold text-slate-900 mb-4">Interview Questions</h3>
              <ol className="space-y-3 list-decimal list-inside">
                {candidate.interviewQuestions.map((q) => (
                  <li key={q} className="text-sm text-slate-600 leading-snug">{q}</li>
                ))}
              </ol>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'resume' && (
        <Card className="!p-6">
          <h3 className="text-base font-bold text-slate-900 mb-1">Resume</h3>
          <p className="text-sm text-slate-500 mb-6">{candidate.resumeFilename || 'No file name'}</p>
          <div className="bg-slate-50 rounded-xl p-10 text-center border border-slate-100">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            {candidate.resumeUrl ? (
              <a
                href={candidate.resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Open Resume URL
              </a>
            ) : (
              <p className="text-sm text-slate-500">Resume URL not available yet.</p>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'experience' && (
        <Card className="!p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4">Work Experience</h3>
          {(candidate.experienceHistory || []).length === 0 ? (
            <p className="text-sm text-slate-400">No experience details returned from screening yet.</p>
          ) : (
            <div className="space-y-6">
              {candidate.experienceHistory.map((exp, i) => (
                <div key={i} className="relative pl-6 pb-6 border-l-2 border-indigo-100 last:pb-0">
                  <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 bg-indigo-500 rounded-full" />
                  <h4 className="text-sm font-semibold text-slate-900">{exp.title}</h4>
                  <p className="text-sm text-indigo-600 mt-0.5">{exp.company}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{exp.duration}</p>
                  <p className="text-sm text-slate-600 mt-2">{exp.description}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'education' && (
        <Card className="!p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4">Education</h3>
          {(candidate.education || []).length === 0 ? (
            <p className="text-sm text-slate-400">No education details returned yet.</p>
          ) : (
            <div className="space-y-3">
              {candidate.education.map((edu, i) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                  <GraduationCap className="w-5 h-5 text-indigo-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">{edu.degree}</h4>
                    <p className="text-sm text-slate-500">{edu.school}</p>
                    <p className="text-xs text-slate-400">{edu.year}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'skills' && (
        <Card className="!p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {(candidate.skills || []).length === 0 ? (
              <p className="text-sm text-slate-400">No skills list returned yet.</p>
            ) : (
              candidate.skills.map((skill) => (
                <span key={skill} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg border border-indigo-100">
                  {skill}
                </span>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

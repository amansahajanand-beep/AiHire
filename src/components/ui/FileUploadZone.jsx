import { useState } from 'react';
import { Upload, FileText, CheckCircle2, X } from 'lucide-react';
import { formatFileSize } from '../../utils/helpers';

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const MAX_TOTAL_SIZE = 20 * 1024 * 1024;

const isPdf = (f) => f.name.toLowerCase().endsWith('.pdf') && (!f.type || f.type === 'application/pdf');

/**
 * Keeps real File objects so they can be uploaded to FastAPI → n8n.
 * Only valid PDFs are accepted: max `maxFiles` files, `maxFileSize` per file, `maxTotalSize` overall.
 */
export default function FileUploadZone({
  files,
  onFilesChange,
  maxFiles = 10,
  maxFileSize = MAX_FILE_SIZE,
  maxTotalSize = MAX_TOTAL_SIZE,
}) {
  const [errors, setErrors] = useState([]);

  const handleDrop = (e) => {
    e.preventDefault();
    addFiles(Array.from(e.dataTransfer.files));
  };

  const handleSelect = (e) => {
    addFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const addFiles = (newFiles) => {
    const accepted = [];
    const problems = [];
    let totalSize = files.reduce((sum, f) => sum + f.size, 0);

    newFiles.forEach((f) => {
      if (!isPdf(f)) {
        problems.push(`"${f.name}" is not a PDF. Only PDF files are allowed.`);
      } else if (f.size > maxFileSize) {
        problems.push(`"${f.name}" is ${formatFileSize(f.size)}. Each file must be ${formatFileSize(maxFileSize)} or smaller.`);
      } else if (files.length + accepted.length >= maxFiles) {
        problems.push(`"${f.name}" was not added. You can upload a maximum of ${maxFiles} files.`);
      } else if (totalSize + f.size > maxTotalSize) {
        problems.push(`"${f.name}" was not added. Total size cannot exceed ${formatFileSize(maxTotalSize)}.`);
      } else {
        totalSize += f.size;
        accepted.push({
          id: `${f.name}-${f.size}-${f.lastModified}-${Math.random()}`,
          name: f.name,
          size: f.size,
          file: f,
          status: 'ready',
        });
      }
    });

    setErrors(problems);
    if (accepted.length > 0) onFilesChange([...files, ...accepted]);
  };

  const removeFile = (id) => {
    onFilesChange(files.filter((f) => f.id !== id));
  };

  return (
    <div>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="border-2 border-dashed border-indigo-300 bg-indigo-50/40 rounded-xl p-12 text-center hover:border-indigo-500 hover:bg-indigo-50/70 transition-colors cursor-pointer"
      >
        <input
          type="file"
          multiple
          accept=".pdf,application/pdf"
          onChange={handleSelect}
          className="hidden"
          id="file-upload"
          disabled={files.length >= maxFiles}
        />
        <label htmlFor="file-upload" className="cursor-pointer block">
          <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center">
            <Upload className="w-10 h-10 text-indigo-600" strokeWidth={1.5} />
          </div>
          <p className="text-base font-semibold text-indigo-600 mb-1">Drop resumes here or click to browse</p>
          <p className="text-sm text-slate-400">PDF only · max 10 files · 2 MB per file · 20 MB total</p>
        </label>
      </div>

      <p className="mt-4 text-sm text-slate-500">
        Uploaded: <span className="font-semibold text-slate-700">{files.length} / {maxFiles}</span>
      </p>

      {errors.length > 0 && (
        <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3 space-y-1">
          {errors.map((msg) => (
            <p key={msg}>{msg}</p>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-3 divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-white">
          {files.map((file) => (
            <div key={file.id} className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-red-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
                  <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <button onClick={() => removeFile(file.id)} className="p-1 hover:bg-slate-100 rounded" title="Remove">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

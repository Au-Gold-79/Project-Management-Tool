import { useState } from "react";
import { Download, FileText, Upload, Trash2 } from "lucide-react";
import type { Workspace } from "../../shared/model";
import type { Actions } from "../queries/workspace";
import { Empty } from "./workspace-ui";

export function FilesPanel({
  projectId,
  taskId = "",
  data,
  actions,
}: {
  projectId: string;
  taskId?: string;
  data: Workspace;
  actions: Actions;
}) {
  const [error, setError] = useState("");
  const files = data.files.filter(
    (f) => f.projectId === projectId && (!taskId || f.taskId === taskId),
  );
  async function upload(file: File) {
    setError("");
    if (!file.size || file.size > 20 * 1024 * 1024) {
      setError("Choose a nonempty file smaller than 20 MB.");
      return;
    }
    try {
      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      await actions.upload.mutateAsync({
        projectId,
        taskId,
        name: file.name,
        mime: file.type,
        data: content,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    }
  }
  return (
    <div className="files-panel">
      <div className="section-heading">
        <div>
          <h3>Project files</h3>
          <p className="muted">Stored in this workspace · 20 MB maximum per file</p>
        </div>
        <label className="upload-btn">
          <Upload size={15} />
          {actions.upload.isPending ? "Uploading…" : "Upload file"}
          <input
            type="file"
            aria-label="Upload file"
            disabled={actions.busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {!files.length ? (
        <Empty title="No files yet" detail="Upload a brief, reference, or deliverable." />
      ) : (
        <div className="file-list">
          {files.map((f) => (
            <div className="file-row" key={f.id}>
              <FileText size={24} />
              <div>
                <b>{f.name}</b>
                <small>
                  {(f.size / 1024).toFixed(1)} KB · {new Date(f.createdAt).toLocaleDateString()}
                </small>
              </div>
              <a
                aria-label={`Download ${f.name}`}
                className="icon-btn"
                href={`/api/files/${f.id}`}
                download
              >
                <Download size={18} />
              </a>
              <button
                aria-label={`Delete ${f.name}`}
                className="icon-btn"
                disabled={actions.busy}
                onClick={async () => {
                  if (!confirm(`Delete ${f.name}?`)) return;
                  try {
                    await actions.remove.mutateAsync({ kind: "files", id: f.id });
                  } catch (e) {
                    setError(String(e));
                  }
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

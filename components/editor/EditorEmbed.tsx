"use client";

import React, { useEffect, useRef, useState } from "react";

interface EditorEmbedProps {
  editorUrl?: string;
  initialImportUrl?: string;
  initialImportFile?: File | Blob;
  initialName?: string;
  editorRouteHash?: string;
}

export default function EditorEmbed({
  editorUrl = "http://localhost:5173",
  initialImportUrl,
  initialImportFile,
  initialName,
  editorRouteHash,
}: EditorEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [signedUrl, setSignedUrl] = useState("");
  const [name, setName] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const autoImportedRef = useRef(false);

  const editorSrc = (() => {
    const baseUrl = editorUrl.replace(/#.*$/, "");
    if (editorRouteHash) {
      return `${baseUrl}${editorRouteHash}`;
    }
    if (initialImportUrl || initialImportFile) {
      return `${baseUrl}#/editor`;
    }
    return editorUrl;
  })();

  useEffect(() => {
    if (initialImportUrl) {
      setSignedUrl(initialImportUrl);
      if (initialName) setName(initialName);
    }
    if (initialImportFile && initialName) {
      setName(initialName);
    }

    const listener = (evt: MessageEvent) => {
      // accept messages only from the editor origin (best-effort check)
      try {
        const editorOrigin = new URL(editorUrl, window.location.href).origin;
        if (evt.origin !== editorOrigin) return;
      } catch {
        // ignore origin check if URL invalid
      }

      if (!evt.data || typeof evt.data !== "object") return;
      const { type } = evt.data as any;
      if (type === "IMPORT_RESULT") {
        setIsImporting(false);
        setImportError(evt.data.success ? null : evt.data.error || "Import failed");
        setLog((l) => [...l, `IMPORT_RESULT: ${evt.data.success ? "ok" : "error"} ${evt.data.error || ""}`]);
      } else if (type === "EXPORT_PROGRESS") {
        setLog((l) => [...l, `EXPORT_PROGRESS: ${Math.round((evt.data.progress || 0) * 100)}% ${evt.data.phase || ""}`]);
      } else if (type === "EXPORT_UPLOAD_RESULT") {
        setLog((l) => [...l, `EXPORT_UPLOAD_RESULT: ${evt.data.success ? "ok" : "error"} ${evt.data.error || ""}`]);

        // If the editor provided the project JSON along with the upload result, persist it.
        if (evt.data.success && evt.data.project) {
          saveProject(evt.data.project);
        } else if (evt.data.success) {
          // Request project JSON from the editor iframe if it wasn't included.
          const iframe = iframeRef.current;
          if (iframe) {
            const origin = (() => {
              try {
                return new URL(editorUrl, window.location.href).origin;
              } catch {
                return "*";
              }
            })();
            iframe.contentWindow?.postMessage({ type: "REQUEST_PROJECT_JSON", id: evt.data.id }, origin);
            setLog((l) => [...l, `Requested project JSON from editor (id=${evt.data.id})`]);
          }
        }
      } else if (type === "PROJECT_JSON") {
        // Editor responded with project JSON
        try {
          const project = evt.data.project;
          if (project) saveProject(project);
        } catch (e: any) {
          setLog((l) => [...l, `PROJECT_JSON handling failed: ${e?.message || e}`]);
        }
      }
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [editorUrl]);

  // If we have an initial import source and the iframe is ready, send IMPORT_FROM_PLATFORM once.
  useEffect(() => {
    if (!iframeLoaded || autoImportedRef.current) return;
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    const origin = (() => {
      try {
        return new URL(editorUrl, window.location.href).origin;
      } catch {
        return "*";
      }
    })();

    if (initialImportFile) {
      setIsImporting(true);
      setImportError(null);
      iframe.contentWindow.postMessage({ type: "IMPORT_FROM_PLATFORM", file: initialImportFile, name: initialName || '' }, origin);
      autoImportedRef.current = true;
      setLog((l) => [...l, `Auto-imported file ${initialName || 'project video'}`]);
      return;
    }

    if (initialImportUrl) {
      setIsImporting(true);
      setImportError(null);
      iframe.contentWindow.postMessage({ type: "IMPORT_FROM_PLATFORM", url: initialImportUrl, name: initialName || '' }, origin);
      autoImportedRef.current = true;
      setLog((l) => [...l, `Auto-imported ${initialImportUrl}`]);
    }
  }, [initialImportUrl, initialImportFile, initialName, editorUrl, iframeLoaded]);

  async function saveProject(project: any) {
    try {
      setLog((l) => [...l, `Saving project ${project?.id || project?.name || 'unknown'}`]);
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'failed');
      setLog((l) => [...l, `Project saved: ${body.id || body.path || 'ok'}`]);
    } catch (err: any) {
      setLog((l) => [...l, `Save project failed: ${err?.message || err}`]);
    }
  }

  const sendImport = async () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    if (!signedUrl) {
      alert("Please enter a signed URL or public asset URL.");
      return;
    }
    setIsImporting(true);
    setImportError(null);
    const origin = (() => {
      try {
        return new URL(editorUrl, window.location.href).origin;
      } catch {
        return "*";
      }
    })();

    iframe.contentWindow?.postMessage({ type: "IMPORT_FROM_PLATFORM", url: signedUrl, name }, origin);
    setLog((l) => [...l, `Sent IMPORT_FROM_PLATFORM -> ${signedUrl}`]);
  };

  const requestUploadAndExport = async () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const defaultName = name || `export_${Date.now()}.mp4`;

    try {
      // Request a presigned upload URL from your backend
      const res = await fetch(`/api/signed-upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: defaultName }),
      });
      if (!res.ok) throw new Error("Failed to get upload URL");
      const body = await res.json();
      const uploadUrl = body.uploadUrl as string;
      if (!uploadUrl) throw new Error("Missing uploadUrl in response");

      const origin = (() => {
        try {
          return new URL(editorUrl, window.location.href).origin;
        } catch {
          return "*";
        }
      })();

      const id = String(Date.now());
      iframe.contentWindow?.postMessage({ type: "EXPORT_AND_UPLOAD", uploadUrl, filename: defaultName, id }, origin);
      setLog((l) => [...l, `Requested export+upload -> ${uploadUrl}`]);
    } catch (err: any) {
      setLog((l) => [...l, `Upload request failed: ${err?.message || err}`]);
    }
  };

  return (
    <div style={{ border: "1px solid #e6e6e6", padding: 12 }}>
      <div style={{ position: 'relative', height: '76vh', minHeight: 520, width: '100%' }}>
        <iframe
          ref={iframeRef}
          src={editorSrc}
          style={{ width: "100%", height: "100%", border: 0, borderRadius: 12, overflow: 'hidden' }}
          onLoad={() => setIframeLoaded(true)}
        />
        {isImporting && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.45)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 12,
              color: '#fff',
              zIndex: 2,
              padding: 16,
              textAlign: 'center',
            }}
          >
            <div style={{ marginBottom: 12, fontSize: 32 }}>⏳</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>Importing video...</div>
            <div style={{ marginTop: 8, maxWidth: 340, fontSize: 13, opacity: 0.9 }}>
              Please wait while the video is imported into the editor.
            </div>
          </div>
        )}
      </div>
      <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
        <input placeholder="Signed download URL or public URL" value={signedUrl} onChange={(e) => setSignedUrl(e.target.value)} style={{ flex: 1 }} disabled={isImporting} />
        <input placeholder="filename (e.g. clip.mp4)" value={name} onChange={(e) => setName(e.target.value)} disabled={isImporting} />
        <button onClick={sendImport} disabled={isImporting}>Import into editor</button>
        <button onClick={requestUploadAndExport} disabled={isImporting}>Export & Upload</button>
      </div>
      {importError && (
        <div style={{ marginTop: 12, border: '1px solid #f87171', background: '#fef2f2', color: '#991b1b', borderRadius: 8, padding: 12 }}>
          {importError}
        </div>
      )}
      <div style={{ marginTop: 12 }}>
        <strong>Log</strong>
        <div style={{ maxHeight: 200, overflowY: 'auto', padding: 12, border: '1px solid #e6e6e6', borderRadius: 8, background: '#fafafa' }}>
          {log.length === 0 ? (
            <div style={{ color: '#666' }}>No activity yet.</div>
          ) : (
            log.map((l, i) => <div key={i} style={{ marginBottom: 6, fontSize: 13, lineHeight: 1.4 }}>{l}</div>)
          )}
        </div>
      </div>
    </div>
  );
}

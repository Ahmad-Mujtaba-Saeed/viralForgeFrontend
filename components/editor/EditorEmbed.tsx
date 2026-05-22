"use client";

import React, { useEffect, useRef, useState } from "react";

export default function EditorEmbed({ editorUrl = "http://localhost:5173" }: { editorUrl?: string }) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [signedUrl, setSignedUrl] = useState("");
  const [name, setName] = useState("");
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
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
        setLog((l) => [...l, `IMPORT_RESULT: ${evt.data.success ? "ok" : "error"} ${evt.data.error || ""}`]);
      } else if (type === "EXPORT_PROGRESS") {
        setLog((l) => [...l, `EXPORT_PROGRESS: ${Math.round((evt.data.progress || 0) * 100)}% ${evt.data.phase || ""}`]);
      } else if (type === "EXPORT_UPLOAD_RESULT") {
        setLog((l) => [...l, `EXPORT_UPLOAD_RESULT: ${evt.data.success ? "ok" : "error"} ${evt.data.error || ""}`]);
      }
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [editorUrl]);

  const sendImport = async () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    if (!signedUrl) {
      alert("Please enter a signed URL or public asset URL.");
      return;
    }
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
      <div style={{ height: 480 }}>
        <iframe ref={iframeRef} src={editorUrl} style={{ width: "100%", height: "100%", border: 0 }} />
      </div>
      <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
        <input placeholder="Signed download URL or public URL" value={signedUrl} onChange={(e) => setSignedUrl(e.target.value)} style={{ flex: 1 }} />
        <input placeholder="filename (e.g. clip.mp4)" value={name} onChange={(e) => setName(e.target.value)} />
        <button onClick={sendImport}>Import into editor</button>
        <button onClick={requestUploadAndExport}>Export & Upload</button>
      </div>
      <div style={{ marginTop: 8 }}>
        <strong>Log</strong>
        <ul>
          {log.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

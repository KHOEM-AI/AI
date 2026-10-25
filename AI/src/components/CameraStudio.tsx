import { useCallback, useEffect, useRef, useState } from "react";
import "../camera/camera.css";
import { CAMERA_PROBLEM_KM, useCamera } from "../camera/useCamera";
import { RECORDER_ERROR_KM, useRecorder } from "../camera/useRecorder";
import { formatBytes, formatClock, stamp } from "../camera/format";

type Props = {
  onClose: () => void;
  /** When given, shows a button that switches back to the 3D Studio. */
  onSwitch?: () => void;
};

type Photo = { url: string; name: string; bytes: number };

export default function CameraStudio({ onClose, onSwitch }: Props) {
  const camera = useCamera();
  const recorder = useRecorder();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const photoUrlRef = useRef<string | null>(null);

  const { recording, stop: stopRecording } = recorder;
  const live = camera.status === "live";

  // If the camera disappears while recording, finish the clip instead of leaving it hanging.
  useEffect(() => {
    if (recording && !camera.stream) stopRecording();
  }, [recording, camera.stream, stopRecording]);

  useEffect(() => {
    return () => {
      if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
    };
  }, []);

  const replacePhoto = useCallback((next: Photo | null) => {
    if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
    photoUrlRef.current = next ? next.url : null;
    setPhoto(next);
  }, []);

  async function takePhoto() {
    setNotice(null);
    const blob = await camera.snapshot();
    if (!blob) {
      setNotice("ថតរូបមិនបាន។ សូមរង់ចាំឱ្យរូបភាពកាមេរ៉ាបង្ហាញសិន។");
      return;
    }
    replacePhoto({
      url: URL.createObjectURL(blob),
      name: `khoem-photo-${stamp()}.jpg`,
      bytes: blob.size,
    });
  }

  function toggleRecording() {
    setNotice(null);
    if (recording) {
      stopRecording();
      return;
    }
    if (camera.stream) recorder.start(camera.stream);
  }

  const problem = camera.failure ? CAMERA_PROBLEM_KM[camera.failure.code] : null;
  const recorderProblem = recorder.error ? RECORDER_ERROR_KM[recorder.error] : null;
  const result = recorder.result;
  const maxMinutes = Math.round(recorder.maxSeconds / 60);

  return (
    <section className="three-studio camera-studio" role="dialog" aria-modal="true" aria-label="Camera Studio">
      <header className="three-studio__header">
        <div>
          <h2>Camera Studio</h2>
          <p>Live camera · Photo · Video</p>
        </div>
        <div className="camera-studio__head-actions">
          {onSwitch && (
            <button className="three-studio__button" onClick={onSwitch} disabled={recording}>
              🧊 3D Studio
            </button>
          )}
          <button
            className="three-studio__close"
            onClick={onClose}
            disabled={recording}
            aria-label="Close Camera Studio"
            title={recording ? "សូមបញ្ឈប់ការថតសិន" : undefined}
          >
            ✕
          </button>
        </div>
      </header>

      <div className="three-studio__viewport camera-studio__viewport">
        <video
          ref={camera.videoRef}
          className={`camera-studio__video${camera.facing === "user" ? " is-mirrored" : ""}`}
          playsInline
          muted
          autoPlay
        />
        {!live && (
          <div
            className={`camera-studio__placeholder${camera.status === "error" ? " is-error" : ""}`}
            role="status"
            aria-live="polite"
          >
            <p>
              {camera.status === "starting"
                ? "កំពុងបើកកាមេរ៉ា…"
                : problem ?? "ចុច «បើកកាមេរ៉ា» ដើម្បីចាប់ផ្ដើម"}
            </p>
          </div>
        )}
        {recording && (
          <div className="camera-studio__rec" aria-live="off">
            <span className="camera-studio__dot" />
            REC {formatClock(recorder.seconds)}
          </div>
        )}
      </div>

      <div className="three-studio__controls">
        {live ? (
          <button className="three-studio__button" onClick={camera.stop} disabled={recording}>
            ⏻ បិទកាមេរ៉ា
          </button>
        ) : (
          <button
            className="three-studio__button camera-studio__button--primary"
            onClick={() => void camera.start()}
            disabled={camera.status === "starting"}
          >
            📷 បើកកាមេរ៉ា
          </button>
        )}
        <button className="three-studio__button" onClick={camera.flip} disabled={recording}>
          🔄 {camera.facing === "user" ? "កាមេរ៉ាមុខ" : "កាមេរ៉ាក្រោយ"}
        </button>
        <button className="three-studio__button" onClick={() => void takePhoto()} disabled={!live}>
          📸 ថតរូប
        </button>
        <button
          className={`three-studio__button${recording ? " camera-studio__button--record" : ""}`}
          onClick={toggleRecording}
          disabled={!live || !recorder.supported}
        >
          {recording ? "⏹ បញ្ឈប់ការថត" : "⏺ ថតវីដេអូ"}
        </button>
        <label className="camera-studio__mic">
          <input
            type="checkbox"
            checked={camera.withAudio}
            onChange={camera.toggleAudio}
            disabled={recording}
          />
          <span>ថតជាមួយសំឡេង (មីក្រូហ្វូន)</span>
        </label>
      </div>

      {(notice || recorderProblem) && (
        <p className="camera-studio__message" role="alert">
          {notice ?? recorderProblem}
        </p>
      )}

      {(photo || result) && (
        <div className="camera-studio__results">
          {photo && (
            <article className="camera-studio__card">
              <h3>រូបថតចុងក្រោយ</h3>
              <img src={photo.url} alt="រូបថតពីកាមេរ៉ា" />
              <span className="camera-studio__meta">
                {photo.name} · {formatBytes(photo.bytes)}
              </span>
              <div className="camera-studio__card-actions">
                <a className="three-studio__button camera-studio__link" href={photo.url} download={photo.name}>
                  ⬇ រក្សាទុក
                </a>
                <button className="three-studio__button" onClick={() => replacePhoto(null)}>
                  លុប
                </button>
              </div>
            </article>
          )}
          {result && (
            <article className="camera-studio__card">
              <h3>វីដេអូចុងក្រោយ</h3>
              <video src={result.url} controls playsInline />
              <span className="camera-studio__meta">
                {result.name} · {formatClock(result.seconds)} · {formatBytes(result.bytes)}
              </span>
              <div className="camera-studio__card-actions">
                <a className="three-studio__button camera-studio__link" href={result.url} download={result.name}>
                  ⬇ រក្សាទុក
                </a>
                <button className="three-studio__button" onClick={recorder.clear} disabled={recording}>
                  លុប
                </button>
              </div>
            </article>
          )}
        </div>
      )}

      <p className="three-studio__note">
        កាមេរ៉ាត្រូវការសិទ្ធិពីកម្មវិធីរុករក និងដំណើរការលើ HTTPS ឬ localhost ប៉ុណ្ណោះ។
        រូប និងវីដេអូស្ថិតក្នុងកម្មវិធីរុករក មិនត្រូវបានផ្ញើទៅ server ទេ — ចុច «រក្សាទុក» ដើម្បីទាញយក។
        ការថតវីដេអូបញ្ឈប់ស្វ័យប្រវត្តិនៅ {maxMinutes} នាទី ដើម្បីកុំឱ្យអស់ RAM។
      </p>
    </section>
  );
}

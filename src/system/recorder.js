// src/system/recorder.js
export function createRecorderSystem(state) {

  function syncScreenRecUI() {
    const btn = state.btnScreenRec;
    if (!btn) return;
    if (state.isScreenRecording) {
      btn.textContent = "Detener";
      btn.classList.add("recording");
    } else {
      btn.textContent = "Grabar";
      btn.classList.remove("recording");
    }
  }

  async function toggleScreenRecord() {
    try {
      if (!state.isScreenRecording) {
        state.recordedChunks = [];

        state.screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: 30 },
          audio: true,
        });

        const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
          ? "video/webm;codecs=vp9"
          : "video/webm";

        state.mediaRecorder = new MediaRecorder(state.screenStream, { mimeType: mime });

        state.mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) state.recordedChunks.push(e.data);
        };

        state.mediaRecorder.onstop = () => {
          const blob = new Blob(state.recordedChunks, { type: "video/webm" });
          const url = URL.createObjectURL(blob);

          const a = document.createElement("a");
          const ts = new Date().toISOString().replaceAll(":", "-").slice(0, 19);
          a.href = url;
          a.download = `futsal-tactica-${ts}.webm`;
          document.body.appendChild(a);
          a.click();
          a.remove();

          setTimeout(() => URL.revokeObjectURL(url), 1000);

          if (state.screenStream) {
            state.screenStream.getTracks().forEach(t => t.stop());
            state.screenStream = null;
          }
          state.mediaRecorder = null;

          state.isScreenRecording = false;
          syncScreenRecUI();
        };

        state.screenStream.getVideoTracks()[0].addEventListener("ended", () => {
          if (state.mediaRecorder && state.mediaRecorder.state !== "inactive") state.mediaRecorder.stop();
        });

        state.mediaRecorder.start(250);
        state.isScreenRecording = true;
        syncScreenRecUI();
        return;
      }

      if (state.mediaRecorder && state.mediaRecorder.state !== "inactive") {
        state.mediaRecorder.stop();
      }
    } catch (err) {
      console.warn("No se pudo grabar pantalla:", err);
      state.isScreenRecording = false;
      syncScreenRecUI();
    }
  }

  return { toggleScreenRecord };
}
export async function convertBlobToWav(blob, audioContext) {
  if (!blob) {
    return blob;
  }

  const type = blob.type || '';
  if (type === 'audio/wav' || type === 'audio/wave' || type === 'audio/x-wav') {
    return blob;
  }

  try {
    const arrayBuffer = await blob.arrayBuffer();

    const context = await getAudioContext(audioContext);
    const decodedBuffer = await decodeAudioData(context, arrayBuffer);
    const wavBuffer = audioBufferToWav(decodedBuffer);

    return new Blob([wavBuffer], { type: 'audio/wav' });
  } catch (error) {
    console.warn('convertBlobToWav: failed to convert, returning original blob', error);
    return blob;
  }
}

async function getAudioContext(existingContext) {
  if (existingContext && existingContext.state !== 'closed') {
    return existingContext;
  }

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    throw new Error('AudioContext is not supported in this browser');
  }

  const context = new AudioCtx();
  if (context.state === 'suspended' && context.resume) {
    try {
      await context.resume();
    } catch (_) {
      // Ignore resume errors; context can still decode.
    }
  }

  return context;
}

function decodeAudioData(context, arrayBuffer) {
  return new Promise((resolve, reject) => {
    const bufferCopy = arrayBuffer.slice(0);
    const decodePromise = context.decodeAudioData(bufferCopy, resolve, reject);
    if (decodePromise && typeof decodePromise.then === 'function') {
      decodePromise.then(resolve).catch(reject);
    }
  });
}

function audioBufferToWav(buffer) {
  const numChannels = buffer.numberOfChannels || 1;
  const sampleRate = buffer.sampleRate || 44100;
  const numFrames = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numFrames * blockAlign;
  const totalSize = 44 + dataSize;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + dataSize, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, 1, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, byteRate, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, blockAlign, true);
  /* bits per sample */
  view.setUint16(34, bytesPerSample * 8, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, dataSize, true);

  /* write interleaved data */
  let offset = 44;
  const channels = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  for (let i = 0; i < numFrames; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      let sample = channels[channel][i];
      sample = Math.max(-1, Math.min(1, sample));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return arrayBuffer;
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}


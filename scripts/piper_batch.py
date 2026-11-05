"""Sintetiza varios textos con Piper cargando el modelo una sola vez.

Uso (lo invoca scripts/gen-audio.mjs):
  python piper_batch.py MODELO.onnx LENGTH_SCALE SILENCIO_SEG
Lee por stdin líneas JSON {"text": ..., "out": ruta.wav} y responde "ok <ruta>" por cada una.
"""
import json
import sys
import wave

from piper import PiperVoice, SynthesisConfig


def main() -> None:
    model, length_scale, silence = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
    voice = PiperVoice.load(model)
    config = SynthesisConfig(length_scale=length_scale)
    pause = bytes(int(voice.config.sample_rate * silence) * 2)
    for line in sys.stdin:
        if not line.strip():
            continue
        job = json.loads(line)
        with wave.open(job["out"], "wb") as wav:
            params_set = False
            for i, chunk in enumerate(voice.synthesize(job["text"], config)):
                if not params_set:
                    wav.setframerate(chunk.sample_rate)
                    wav.setsampwidth(chunk.sample_width)
                    wav.setnchannels(chunk.sample_channels)
                    params_set = True
                if i > 0:
                    wav.writeframes(pause)
                wav.writeframes(chunk.audio_int16_bytes)
        print(f"ok {job['out']}", flush=True)


if __name__ == "__main__":
    main()

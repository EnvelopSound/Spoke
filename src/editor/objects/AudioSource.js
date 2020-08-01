import { Object3D, Audio, PositionalAudio } from "three";
import { RethrownError } from "../utils/errors";

export const AudioType = {
  Stereo: "stereo",
  PannerNode: "pannernode",
  Ambisonics: "ambisonics"
};

export const DistanceModelType = {
  Linear: "linear",
  Inverse: "inverse",
  Exponential: "exponential"
};

export const LoudspeakerSetups = {
  GrazArray: "grazArray",
  GrazArrayXL: "grazArrayXL",
  EnvelopSF: "envelopSF",
  EnvelopSFXL: "envelopSFXL",
  Ico: "ico"
};

export const AudioTypeOptions = Object.values(AudioType).map(v => ({ label: v, value: v }));

export const DistanceModelOptions = Object.values(DistanceModelType).map(v => ({ label: v, value: v }));

export const LoudspeakerSetupOptions = Object.values(LoudspeakerSetups).map(v => ({ label: v, value: v }));

export default class AudioSource extends Object3D {
  constructor(audioListener, elTag = "audio") {
    super();

    const el = document.createElement(elTag);
    el.setAttribute("playsinline", "");
    el.setAttribute("webkit-playsinline", "");
    el.crossOrigin = "anonymous";
    el.loop = true;
    this.el = el;

    this._src = "";
    this.audioListener = audioListener;
    this.controls = true;
    this.audioType = AudioType.Ambisonics;
    this.volume = 0.5;

    this.decodingOrder = 4;
    this.loudspeakerVisible = true;
    this.roomSimulationLevel = 0.5;

    this.loudspeakerSetup = LoudspeakerSetups.GrazArrayXL;
  }

  get duration() {
    return this.el.duration;
  }

  get src() {
    return this.el.src;
  }

  set src(src) {
    this.load(src).catch(console.error);
  }

  get autoPlay() {
    return this.el.autoplay;
  }

  set autoPlay(value) {
    this.el.autoplay = value;
  }

  get loop() {
    return this.el.loop;
  }

  set loop(value) {
    this.el.loop = value;
  }

  get audioType() {
    return this._audioType;
  }

  set audioType(type) {
    if (type === this._audioType) return;

    let audio;
    const oldAudio = this.audio;

    // Also Ambisonics Audio Type creates a PositionalAudio Node, to be replicated
    if (type === AudioType.PannerNode || type === AudioType.Ambisonics) {
      audio = new PositionalAudio(this.audioListener);
    } else {
      audio = new Audio(this.audioListener);
    }

    if (oldAudio) {
      audio.gain.gain.value = oldAudio.getVolume();

      if (this.audioSource) {
        oldAudio.disconnect();
      }

      this.remove(oldAudio);
    }

    if (this.audioSource) {
      audio.setNodeSource(this.audioSource);
    }

    this.audio = audio;
    this.add(audio);
    this._audioType = type;
  }

  get volume() {
    return this.audio.getVolume();
  }

  set volume(value) {
    this.audio.gain.gain.value = value;
  }

  get distanceModel() {
    if (this.audioType === AudioType.PannerNode || this.audioType === AudioType.Ambisonics) {
      return this.audio.getDistanceModel();
    }
    return null;
  }

  set distanceModel(value) {
    if (this.audioType === AudioType.PannerNode || this.audioType === AudioType.Ambisonics) {
      this.audio.setDistanceModel(value);
    }
  }

  get rolloffFactor() {
    if (this.audioType === AudioType.PannerNode || this.audioType === AudioType.Ambisonics) {
      return this.audio.getRolloffFactor();
    }
    return null;
  }

  set rolloffFactor(value) {
    if (this.audioType === AudioType.PannerNode || this.audioType === AudioType.Ambisonics) {
      this.audio.setRolloffFactor(value);
    }
  }

  get refDistance() {
    if (this.audioType === AudioType.PannerNode || this.audioType === AudioType.Ambisonics) {
      return this.audio.getRefDistance();
    }
    return null;
  }

  set refDistance(value) {
    if (this.audioType === AudioType.PannerNode || this.audioType === AudioType.Ambisonics) {
      this.audio.setRefDistance(value);
    }
  }

  get maxDistance() {
    if (this.audioType === AudioType.PannerNode || this.audioType === AudioType.Ambisonics) {
      return this.audio.getMaxDistance();
    }

    return null;
  }

  set maxDistance(value) {
    if (this.audioType === AudioType.PannerNode || this.audioType === AudioType.Ambisonics) {
      this.audio.setMaxDistance(value);
    }
  }

  get coneInnerAngle() {
    if (this.audioType === AudioType.PannerNode || this.audioType === AudioType.Ambisonics) {
      return this.audio.panner.coneInnerAngle;
    }

    return null;
  }

  set coneInnerAngle(value) {
    if (this.audioType === AudioType.PannerNode || this.audioType === AudioType.Ambisonics) {
      this.audio.panner.coneInnerAngle = value;
    }
  }

  get coneOuterAngle() {
    if (this.audioType === AudioType.PannerNode || this.audioType === AudioType.Ambisonics) {
      return this.audio.panner.coneOuterAngle;
    }

    return null;
  }

  set coneOuterAngle(value) {
    if (this.audioType === AudioType.PannerNode || this.audioType === AudioType.Ambisonics) {
      this.audio.panner.coneOuterAngle = value;
    }
  }

  get coneOuterGain() {
    if (this.audioType === AudioType.PannerNode || this.audioType === AudioType.Ambisonics) {
      return this.audio.panner.coneOuterGain;
    }

    return null;
  }

  set coneOuterGain(value) {
    if (this.audioType === AudioType.PannerNode || this.audioType === AudioType.Ambisonics) {
      this.audio.panner.coneOuterGain = value;
    }
  }

  loadMedia(src) {
    return new Promise((resolve, reject) => {
      this.el.src = src;

      let cleanup = null;

      const onLoadedData = () => {
        cleanup();
        resolve();
      };

      const onError = error => {
        cleanup();
        reject(new RethrownError(`Error loading video "${this.el.src}"`, error));
      };

      cleanup = () => {
        this.el.removeEventListener("loadeddata", onLoadedData);
        this.el.removeEventListener("error", onError);
      };

      this.el.addEventListener("loadeddata", onLoadedData);
      this.el.addEventListener("error", onError);
    });
  }

  async load(src) {
    await this.loadMedia(src);
    this.audioSource = this.audioListener.context.createMediaElementSource(this.el);
    this.audio.setNodeSource(this.audioSource);
    return this;
  }

  copy(source, recursive = true) {
    super.copy(source, false);

    if (recursive) {
      for (let i = 0; i < source.children.length; i++) {
        const child = source.children[i];
        if (child !== source.audio) {
          this.add(child.clone());
        }
      }
    }

    this.controls = source.controls;
    this.autoPlay = source.autoPlay;
    this.loop = source.loop;
    this.audioType = source.audioType;
    this.volume = source.volume;
    this.distanceModel = source.distanceModel;
    this.rolloffFactor = source.rolloffFactor;
    this.refDistance = source.refDistance;
    this.maxDistance = source.maxDistance;
    this.coneInnerAngle = source.coneInnerAngle;
    this.coneOuterAngle = source.coneOuterAngle;
    this.coneOuterGain = source.coneOuterGain;
    this.src = source.src;
    this.loudspeakerSetup = source.loudspeakerSetup;
    this.loudspeakerVisible = source.loudspeakerVisible;
    this.loudspeakerArrayOffset = source.loudspeakerArrayOffset;
    this.roomSimulationLevel = source.roomSimulationLevel;
    this.decodingOrder = source.decodingOrder;

    return this;
  }
}

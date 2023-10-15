import { useEffect, useRef } from "react";
import adapter from "webrtc-adapter";

interface ICEServer {
  urls: string[];
  username?: string;
  credential?: string;
  credentialType?: string;
}

interface Offer {
  iceUfrag: string;
  icePwd: string;
  medias: string[];
}

function unquoteCredential(v: string): string {
  return JSON.parse(`"${v}"`);
}

function linkToIceServers(links: string | null) {
  if (links === null) return [];

  let iceServers: ICEServer[] = [];
  for (const link of links.split(", ")) {
    const m = link.match(
      /^<(.+?)>; rel="ice-server"(; username="(.*?)"; credential="(.*?)"; credential-type="password")?/i
    );
    if (m === null) continue;

    iceServers.push(
      m[3] !== undefined
        ? {
            // turn server
            urls: [m[1]],
            username: unquoteCredential(m[3]),
            credential: unquoteCredential(m[4]),
            credentialType: "password",
          }
        : {
            // stun server
            urls: [m[1]],
          }
    );
  }

  return iceServers;
}

const parseOffer = (offer?: string) => {
  if (offer === undefined) return null;
  const ret: Offer = {
    iceUfrag: "",
    icePwd: "",
    medias: [],
  };

  for (const line of offer.split("\r\n")) {
    if (line.startsWith("m=")) {
      ret.medias.push(line.slice("m=".length));
    } else if (ret.iceUfrag === "" && line.startsWith("a=ice-ufrag:")) {
      ret.iceUfrag = line.slice("a=ice-ufrag:".length);
    } else if (ret.icePwd === "" && line.startsWith("a=ice-pwd:")) {
      ret.icePwd = line.slice("a=ice-pwd:".length);
    }
  }

  return ret;
};

const generateSdpFragment = (
  offerData: Offer,
  candidates: RTCIceCandidate[]
) => {
  const candidatesByMedia: { [key: number]: RTCIceCandidate[] } = {};
  for (const candidate of candidates) {
    const mid = candidate.sdpMLineIndex;
    if (mid === null) continue;

    if (candidatesByMedia[mid] === undefined) {
      candidatesByMedia[mid] = [];
    }
    candidatesByMedia[mid].push(candidate);
  }

  let frag =
    "a=ice-ufrag:" +
    offerData.iceUfrag +
    "\r\n" +
    "a=ice-pwd:" +
    offerData.icePwd +
    "\r\n";

  let mid = 0;

  for (const media of offerData.medias) {
    if (candidatesByMedia[mid] !== undefined) {
      frag += "m=" + media + "\r\n" + "a=mid:" + mid + "\r\n";

      for (const candidate of candidatesByMedia[mid]) {
        frag += "a=" + candidate.candidate + "\r\n";
      }
    }
    mid++;
  }

  return frag;
};

class WHEPClient {
  video: HTMLVideoElement;
  streamUrl: URL;
  pc: RTCPeerConnection | null = null;
  eTag: string | null = "";
  queuedCandidates: RTCIceCandidate[] = [];
  offerData: Offer | null = null;
  onSuccess: (resp?: any) => void;
  onError: (err?: any) => void;

  constructor(
    videoElement: HTMLVideoElement,
    streamUrl: URL,
    onSuccess: (resp?: any) => void,
    onError: (err?: any) => void
  ) {
    this.video = videoElement;
    this.streamUrl = streamUrl;
    this.onSuccess = onSuccess;
    this.onError = onError;
    this.start();
  }

  start() {
    console.log(adapter.browserDetails);
    console.log("requesting ICE servers");

    fetch(this.streamUrl, { method: "OPTIONS" })
      .then((res) => this.onIceServers(res))
      .catch((err) => {
        console.log("error: " + err);
        this.onError(err);
      });
  }

  onIceServers(res: Response) {
    this.pc = new RTCPeerConnection({
      iceServers: linkToIceServers(res?.headers?.get("Link")),
    });

    const direction = "sendrecv";
    this.pc.addTransceiver("video", { direction });
    this.pc.addTransceiver("audio", { direction });

    this.pc.onicecandidate = (e) => this.onLocalCandidate(e);
    this.pc.oniceconnectionstatechange = () => this.onConnectionState();

    this.pc.ontrack = (e) => {
      console.log("new track:", e.track.kind);
      this.video.srcObject = e.streams[0];
      this.onSuccess();
    };

    this.pc
      .createOffer()
      .then((offer: RTCSessionDescriptionInit) => this.onLocalOffer(offer));
  }

  onLocalOffer(offer: RTCSessionDescriptionInit) {
    if (this.pc === null) return;

    this.offerData = parseOffer(offer.sdp);
    this.pc.setLocalDescription(offer);

    console.log("sending offer");

    fetch(this.streamUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/sdp",
      },
      body: offer.sdp,
    })
      .then((res) => {
        if (res.status !== 201) {
          throw new Error("bad status code");
        }
        this.eTag = res.headers.get("ETag");
        return res.text();
      })
      .then((sdp) =>
        this.onRemoteAnswer(
          new RTCSessionDescription({
            type: "answer",
            sdp,
          })
        )
      )
      .catch((err) => {
        console.log("error: " + err);
        this.onError(err);
      });
  }

  onConnectionState() {
    console.log("peer connection state:", this.pc?.iceConnectionState);

    switch (this.pc?.iceConnectionState) {
      case "disconnected":
        this.onError(new Error("peer connection disconnected"));
    }
  }

  onRemoteAnswer(answer: RTCSessionDescriptionInit) {
    if (this.pc === null) return;

    this.pc.setRemoteDescription(new RTCSessionDescription(answer));

    if (this.queuedCandidates.length !== 0) {
      this.sendLocalCandidates(this.queuedCandidates);
      this.queuedCandidates = [];
    }
  }

  onLocalCandidate(e: RTCPeerConnectionIceEvent) {
    if (e.candidate === null) return;

    if (this.eTag === "") {
      this.queuedCandidates.push(e.candidate);
    } else {
      this.sendLocalCandidates([e.candidate]);
    }
  }

  sendLocalCandidates(candidates: RTCIceCandidate[]) {
    if (this.offerData === null) return;

    const headers = new Headers();
    headers.append("Content-Type", "application/trickle-ice-sdpfrag");
    if (this.eTag) headers.append("If-Match", this.eTag);
    fetch(this.streamUrl, {
      method: "PATCH",
      headers,
      body: generateSdpFragment(this.offerData, candidates),
    })
      .then((res) => {
        if (res.status !== 204) {
          throw new Error("bad status code");
        }
      })
      .catch((err) => {
        this.onError(err);
      });
  }
}

export default function useWebRTCPlayer(
  videoElement: HTMLVideoElement,
  middlewareHostname: string,
  streamID: string
) {
  const clientRef = useRef<WHEPClient | null>(null);
  const streamUrl = useRef<URL | null>(null);

  const startStream = ({
    onSuccess,
    onError,
  }: {
    onSuccess: (resp?: any) => void;
    onError: (err?: any) => void;
  }) => {
    try {
      let url = new URL(`https://${middlewareHostname}/${streamID}/whep`);
      // url.searchParams.set("auth", "secret");
      streamUrl.current = url;
      clientRef.current = new WHEPClient(videoElement, url, onSuccess, onError);
    } catch (err) {
      console.log(err);
      onError(err);
    }
  };

  const stopStream = () => {
    clientRef.current?.pc?.close();
  };

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  return {
    startStream,
    stopStream,
  };
}

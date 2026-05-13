/**
 * Type declarations for react-native-webrtc
 * Fills in missing types from the package's incomplete typings
 */

declare module 'react-native-webrtc' {
  export class RTCPeerConnection {
    constructor(configuration?: any);

    localDescription: any;
    remoteDescription: any;
    connectionState: string;
    iceConnectionState: string;
    iceGatheringState: string;
    signalingState: string;

    createOffer(options?: any): Promise<any>;
    createAnswer(options?: any): Promise<any>;
    setLocalDescription(desc: any): Promise<void>;
    setRemoteDescription(desc: any): Promise<void>;
    addIceCandidate(candidate: any): Promise<void>;
    addTrack(track: any, stream: any): void;
    addStream(stream: any): void;
    removeStream(stream: any): void;
    getStats(): Promise<any>;
    close(): void;

    addEventListener(event: string, handler: (event: any) => void): void;
    removeEventListener(event: string, handler: (event: any) => void): void;

    // Event handler properties
    onicecandidate: ((event: any) => void) | null;
    ontrack: ((event: any) => void) | null;
    onaddstream: ((event: any) => void) | null;
    onconnectionstatechange: (() => void) | null;
    oniceconnectionstatechange: (() => void) | null;
    onicegatheringstatechange: (() => void) | null;
    onsignalingstatechange: (() => void) | null;
    ondatachannel: ((event: any) => void) | null;
  }

  export class RTCSessionDescription {
    constructor(init: any);
    type: string;
    sdp: string;
  }

  export class RTCIceCandidate {
    constructor(init: any);
    candidate: string;
    sdpMid: string;
    sdpMLineIndex: number;
  }

  export class MediaStream {
    constructor(tracks?: any[]);
    id: string;
    active: boolean;

    getTracks(): any[];
    getAudioTracks(): any[];
    getVideoTracks(): any[];
    addTrack(track: any): void;
    removeTrack(track: any): void;
    toURL(): string;
    release(): void;
  }

  export const mediaDevices: {
    getUserMedia(constraints: any): Promise<MediaStream>;
    enumerateDevices(): Promise<any[]>;
  };

  export class RTCView extends React.Component<{
    streamURL: string;
    style?: any;
    objectFit?: 'contain' | 'cover';
    mirror?: boolean;
    zOrder?: number;
  }> {}

  export function registerGlobals(): void;
}

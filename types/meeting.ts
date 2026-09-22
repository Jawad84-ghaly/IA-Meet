export type MeetingSummary = {
  contexte: string;
  pointsCles: string[];
  decisions: string[];
  actionsAVenir: MeetingAction[];
};

export type MeetingAction = {
  action: string;
  responsable: string;
  delai: string;
};

export type Meeting = {
  id: string;
  createdAt: string;
  durationMillis: number;
  transcription: string;
  summary: MeetingSummary;
};

export type AnalysisResult = {
  transcription: string;
  summary: MeetingSummary;
};

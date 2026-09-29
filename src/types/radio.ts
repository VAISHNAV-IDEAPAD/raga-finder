export interface RadioSong {
  id: string;
  title: string;
  movie: string;
  musicDirector: string;
  year: string;
  singers: string;
  lyricist: string;
  raga: string;
  youtubeUrl: string;
  searchQuery: string;
  videoId?: string;
}

export interface RagaRadioChannel {
  id: string;
  name: string;
  songCount: number;
  rank: number;
  defaultVideoId?: string;
  songs: RadioSong[];
}

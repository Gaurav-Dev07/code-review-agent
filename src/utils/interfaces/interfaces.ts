export interface IPullRequestFile {
  sha: string;
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  blob_url: string;
  raw_url: string;
  contents_url: string;
  patch: string;
}

export interface ICodeReviewResponse {
  comments: ICodeReviewComment[]; // Array of comments for the code review
}
export interface ICodeReviewComment {
  file: string; // The file path in the code diff
  comment: string; // The review comment
  lineNo: number;
  position?: number; // Optional: if you want to target a specific position in the diff
}

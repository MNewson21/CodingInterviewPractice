export interface HintResponse {
  level: number;
  hint: string;
}

export interface ReviewResponse {
  correctness: string;
  timeComplexity: string;
  spaceComplexity: string;
  improvements: string[];
  summary: string;
}

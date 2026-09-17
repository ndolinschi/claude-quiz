export type Choice = {
  key: string;
  text: string;
};

export type Question = {
  id: string;
  set: number;
  stem: string;
  choices: Choice[];
  answer: string;
  explanation: string;
};

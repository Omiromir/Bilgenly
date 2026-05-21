/**
 * DEV-ONLY mock factory for explicitly requested local quiz generation.
 * This file should only be used from the dedicated mock button.
 */

import type { GeneratedQuizResultDto } from "./api/quizGenerationApi";

let sequence = 1;

function uid() {
  return `mock-${Date.now()}-${sequence++}`;
}

interface MockQuestionSpec {
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  type?: "MCQ" | "TrueFalse";
}

const MOCK_QUESTION_BANK: MockQuestionSpec[] = [
  {
    question: "Which organelle is known as the powerhouse of the cell?",
    options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi apparatus"],
    correctIndex: 2,
    explanation:
      "Mitochondria generate ATP through cellular respiration, providing the energy needed for most cellular processes.",
  },
  {
    question: "What is the primary function of DNA polymerase?",
    options: [
      "Transcribing DNA to mRNA",
      "Replicating DNA strands",
      "Breaking down nucleotides",
      "Folding proteins into tertiary structures",
    ],
    correctIndex: 1,
    explanation:
      "DNA polymerase synthesizes new complementary strands during DNA replication by adding nucleotides in the 5' to 3' direction.",
  },
  {
    question:
      "In which phase of mitosis do chromosomes align at the cell's equatorial plate?",
    options: ["Prophase", "Anaphase", "Metaphase", "Telophase"],
    correctIndex: 2,
    explanation:
      "During metaphase, spindle fibers pull chromosomes to the metaphase plate before separation.",
  },
  {
    question: "Which law states that energy cannot be created or destroyed?",
    options: [
      "Newton's Second Law",
      "First Law of Thermodynamics",
      "Boyle's Law",
      "Ohm's Law",
    ],
    correctIndex: 1,
    explanation:
      "The First Law of Thermodynamics states that total energy remains constant in an isolated system.",
  },
  {
    question: "What does the term 'osmosis' describe?",
    options: [
      "Active transport of ions across a membrane",
      "Movement of solutes from low to high concentration",
      "Passive movement of water across a semipermeable membrane",
      "Enzymatic breakdown of large molecules",
    ],
    correctIndex: 2,
    explanation:
      "Osmosis is the net diffusion of water molecules across a semipermeable membrane.",
  },
];

const MOCK_TRUE_FALSE_BANK: MockQuestionSpec[] = [
  {
    question: "The human body has 206 bones in adulthood.",
    options: ["True", "False", "", ""],
    correctIndex: 0,
    explanation:
      "An adult human skeleton typically consists of 206 bones.",
    type: "TrueFalse",
  },
  {
    question: "Water (H2O) is a compound, not an element.",
    options: ["True", "False", "", ""],
    correctIndex: 0,
    explanation:
      "Water contains hydrogen and oxygen atoms chemically bonded together, so it is a compound.",
    type: "TrueFalse",
  },
];

export function buildMockGeneratedQuizResult(
  title: string,
  count: number,
): GeneratedQuizResultDto {
  const totalSlots = Math.max(
    1,
    Math.min(count, MOCK_QUESTION_BANK.length + MOCK_TRUE_FALSE_BANK.length),
  );
  const tfCount = Math.min(2, Math.floor(totalSlots * 0.2));
  const mcqCount = totalSlots - tfCount;
  const pickedMcq = MOCK_QUESTION_BANK.slice(0, mcqCount);
  const pickedTf = MOCK_TRUE_FALSE_BANK.slice(0, tfCount);
  const allSpecs = [...pickedMcq, ...pickedTf];

  const questions = allSpecs.map((spec, index) => {
    const isTrueFalse = spec.type === "TrueFalse";
    const answers = (isTrueFalse ? spec.options.slice(0, 2) : spec.options).map(
      (text, answerIndex) => ({
        id: uid(),
        text,
        isCorrect: answerIndex === spec.correctIndex,
      }),
    );

    return {
      id: uid(),
      text: spec.question,
      questionType: isTrueFalse ? "TrueFalse" : "MCQ",
      explanation: spec.explanation,
      position: index + 1,
      answers,
    };
  });

  return {
    quizId: uid(),
    status: "generated",
    questionsGenerated: questions.length,
    sourceSummary: `Mock source - "${title || "Untitled Quiz"}" (dev mode)`,
    generationTimeSeconds: 0.1,
    questions,
  };
}

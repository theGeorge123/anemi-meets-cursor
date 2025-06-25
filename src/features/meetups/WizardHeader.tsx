interface Props {
  step: number;
}

export const WizardHeader = ({ step }: Props) => (
  <div className="flex items-center gap-2 mb-6">
    {[1, 2, 3, 4, 5].map((n) => (
      <div
        key={n}
        className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold
          ${n <= step ? 'bg-blue-500' : 'bg-gray-300'}`}
      >
        {n}
      </div>
    ))}
    <span className="ml-4 text-sm text-gray-500">Step {step} / 5</span>
  </div>
);

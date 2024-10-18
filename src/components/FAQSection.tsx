import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';

interface FAQ {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  faqs: FAQ[];
  onComplete: () => void;
}

const FAQSection: React.FC<FAQSectionProps> = ({ faqs, onComplete }) => {
  const { t } = useTranslation();
  const [currentFAQIndex, setCurrentFAQIndex] = useState(0);
  const [acknowledgedFAQs, setAcknowledgedFAQs] = useState<boolean[]>(new Array(faqs.length).fill(false));

  const handleAcknowledge = () => {
    const newAcknowledgedFAQs = [...acknowledgedFAQs];
    newAcknowledgedFAQs[currentFAQIndex] = true;
    setAcknowledgedFAQs(newAcknowledgedFAQs);

    if (currentFAQIndex < faqs.length - 1) {
      setCurrentFAQIndex(currentFAQIndex + 1);
    } else {
      onComplete();
    }
  };

  const currentFAQ = faqs[currentFAQIndex];

  return (
    <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">{t('frequentlyAskedQuestions')}</h3>
      <div className="space-y-4">
        <div className="border border-gray-200 rounded-md p-4">
          <h4 className="text-lg font-bold mb-3 text-primary">{t(currentFAQ.question)}</h4>
          <p className="text-gray-600 mb-4">{t(currentFAQ.answer)}</p>
          <button
            onClick={handleAcknowledge}
            className="flex items-center justify-center w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <Check className="mr-2" size={16} />
            {currentFAQIndex < faqs.length - 1 ? t('acknowledgeAndContinue') : t('acknowledgeAndProceed')}
          </button>
        </div>
      </div>
      <div className="mt-4 flex justify-between">
        {faqs.map((_, index) => (
          <div
            key={index}
            className={`w-8 h-1 rounded ${
              index <= currentFAQIndex ? 'bg-primary' : 'bg-gray-300'
            }`}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default FAQSection;
import React from 'react';
import { useTranslation } from 'react-i18next';

const FAQ: React.FC = () => {
  const { t } = useTranslation();

  const faqs = [
    { question: 'faq.question1', answer: 'faq.answer1' },
    { question: 'faq.question2', answer: 'faq.answer2' },
    { question: 'faq.question3', answer: 'faq.answer3' },
    // Add more FAQs as needed
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">{t('frequentlyAskedQuestions')}</h1>
      <div className="space-y-6">
        {faqs.map((faq, index) => (
          <div key={index} className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">{t(faq.question)}</h2>
            <p className="text-gray-600">{t(faq.answer)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;
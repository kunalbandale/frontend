import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface CaptchaProps {
  onVerify: (isValid: boolean) => void;
  disabled?: boolean;
}

const Captcha: React.FC<CaptchaProps> = ({ onVerify, disabled = false }) => {
  const [captchaCode, setCaptchaCode] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState('');

  // Generate random CAPTCHA code with dynamic rotation
  const generateCaptcha = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Initialize CAPTCHA on component mount
  useEffect(() => {
    setCaptchaCode(generateCaptcha());
  }, []);

  // Check if user input matches CAPTCHA
  useEffect(() => {
    const isValidInput = userInput.toUpperCase() === captchaCode.toUpperCase() && userInput.length === captchaCode.length;
    setIsValid(isValidInput);
    onVerify(isValidInput);
    
    if (userInput && !isValidInput) {
      setError('CAPTCHA code does not match');
    } else {
      setError('');
    }
  }, [userInput, captchaCode, onVerify]);

  const handleRefresh = () => {
    setCaptchaCode(generateCaptcha());
    setUserInput('');
    setError('');
    setIsValid(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInput(e.target.value);
  };

  // Generate random rotation for each character
  const getRandomRotation = (index: number) => {
    const rotations = [-15, -10, -5, 0, 5, 10, 15, 20, -20, -25, 25, 30, -30];
    return rotations[index % rotations.length];
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Security Code (CAPTCHA)
        </label>
        
        {/* CAPTCHA Display */}
        <div className="flex items-center space-x-2">
          <div className="flex-1 border border-gray-300 rounded px-2 py-1.5 font-mono text-sm font-bold text-black tracking-wider">
            {captchaCode.split('').map((char, index) => (
              <span 
                key={index} 
                className="inline-block w-4 text-center transform"
                style={{ 
                  transform: `rotate(${getRandomRotation(index)}deg)`,
                  display: 'inline-block'
                }}
              >
                {char}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={disabled}
            className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh CAPTCHA"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        
        {/* User Input */}
        <div className="mt-1.5">
          <input
            type="text"
            value={userInput}
            onChange={handleInputChange}
            placeholder="Enter code above"
            disabled={disabled}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded shadow-sm bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            maxLength={5}
          />
        </div>
        
        {/* Error Message */}
        {error && (
          <p className="mt-1 text-xs text-red-600">{error}</p>
        )}
        
        {/* Success Indicator */}
        {isValid && userInput && (
          <p className="mt-1 text-xs text-green-600 flex items-center">
            <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Verified
          </p>
        )}
      </div>
    </div>
  );
};

export default Captcha;
